import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import examples from "libphonenumber-js/examples.mobile.json";
import {
  parsePhoneNumberFromString,
  validatePhoneNumberLength,
  getExampleNumber,
} from "libphonenumber-js";
import toast from "react-hot-toast";
import {
  CheckCircle,
  MapPin,
  Search,
  ChevronDown,
  Mail,
  Phone,
  Clock,
  Loader2,
  Navigation,
  AlertCircle,
  ShieldAlert,
  LocateFixed,
  Pencil,
} from "lucide-react";

import api from "../utils/api";
import { useAuth } from "../context/authContext";
import { formatCurrency } from "../utils/currency";
import { State, City } from "country-state-city";

const buildMapEmbedUrl = ([latitude, longitude]) => {
  const lat = Number.isFinite(latitude) ? latitude : 20;
  const lng = Number.isFinite(longitude) ? longitude : 0;
  const delta = 0.08;
  const left = lng - delta;
  const right = lng + delta;
  const top = lat + delta;
  const bottom = lat - delta;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat}%2C${lng}`;
};

const getFlagEmoji = (countryCode) => {
  if (!countryCode || countryCode.length !== 2) return "🌍";

  return String.fromCodePoint(
    ...countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0)),
  );
};

const normalizeDialCode = (dialCode) => {
  if (!dialCode) return "";

  const normalized = dialCode.trim().replace(/[^\d+]/g, "");
  return normalized.startsWith("+")
    ? normalized
    : `+${normalized.replace(/^\+/, "")}`;
};

const normalizeShippingField = (value) => String(value || "").trim();

const normalizeShippingPhone = (phone, countryCode, dialCode = "") => {
  const rawPhone = String(phone || "").trim();
  if (!rawPhone) return "";

  try {
    const parsedPhone = parsePhoneNumberFromString(
      rawPhone,
      countryCode || undefined,
    );
    if (parsedPhone?.isValid()) {
      return parsedPhone.number;
    }
  } catch (e) {
    // Fall back to manual normalization below.
  }

  const normalizedDialCode = normalizeDialCode(dialCode);
  const digitsOnly = rawPhone.replace(/[^\d]/g, "");
  return normalizedDialCode ? `${normalizedDialCode}${digitsOnly}` : digitsOnly;
};

const isShippingAddressChanged = (
  savedAddress = {},
  formData = {},
  dialCode = "",
) => {
  const fieldsToCompare = [
    ["fullName", normalizeShippingField],
    ["country", normalizeShippingField],
    ["countryCode", (value) => normalizeShippingField(value).toUpperCase()],
    ["state", normalizeShippingField],
    ["city", normalizeShippingField],
    ["postalCode", normalizeShippingField],
    ["address", normalizeShippingField],
    ["additionalDetails", normalizeShippingField],
  ];

  for (const [field, normalizer] of fieldsToCompare) {
    if (normalizer(savedAddress[field]) !== normalizer(formData[field])) {
      return true;
    }
  }

  return (
    normalizeShippingPhone(
      savedAddress.phone,
      savedAddress.countryCode,
      dialCode,
    ) !== normalizeShippingPhone(formData.phone, formData.countryCode, dialCode)
  );
};

const buildGeoAddress = (data) => {
  const parts = [
    data.address?.house_number,
    data.address?.road,
    data.address?.suburb,
    data.address?.neighbourhood,
    data.address?.city,
    data.address?.town,
    data.address?.village,
    data.address?.county,
    data.address?.state,
    data.address?.postcode,
    data.address?.country,
  ].filter(Boolean);

  if (parts.length > 0) {
    return parts.slice(0, 3).join(", ");
  }

  return data.display_name || "";
};

const CountryFlag = ({ country }) => {
  if (country?.flag) {
    return (
      <img
        src={country.flag}
        alt={`${country.name} flag`}
        className="w-5 h-5 rounded-full object-cover border border-border/50 shrink-0"
      />
    );
  }

  return (
    <span className="text-lg leading-none">{getFlagEmoji(country?.code)}</span>
  );
};

const getNationalPhoneLimit = (countryCode) => {
  if (!countryCode) return null;

  try {
    const exampleNumber = getExampleNumber(countryCode, examples);
    const nationalLength = exampleNumber?.nationalNumber?.length;
    return Number.isFinite(nationalLength) ? nationalLength : null;
  } catch (e) {
    return null;
  }
};

export default function InternationalOrderPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const feedbackToastOptions = {
    toasterId: "international-feedback",
    duration: 1000,
  };
  const modalToastOptions = {
    toasterId: "modal",
    duration: Infinity,
  };

  const [countries, setCountries] = useState([]);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [geolocationBusy, setGeolocationBusy] = useState(false);

  // Custom dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState(() => {
    const savedCountryCode = user?.shippingAddress?.countryCode || "";
    const savedState = user?.shippingAddress?.state || "";
    let initialStateCode = "";
    if (savedCountryCode && savedState) {
      const states = State.getStatesOfCountry(savedCountryCode);
      const matchedState = states.find((s) => s.name === savedState);
      if (matchedState) initialStateCode = matchedState.isoCode;
    }

    return {
      fullName: user?.shippingAddress?.fullName || user?.username || "",
      country: user?.shippingAddress?.country || "",
      countryCode: savedCountryCode,
      state: savedState,
      stateCode: initialStateCode,
      city: user?.shippingAddress?.city || "",
      postalCode: user?.shippingAddress?.postalCode || "",
      address: user?.shippingAddress?.address || "",
      phone: user?.shippingAddress?.phone || user?.phone || "",
      additionalDetails: user?.shippingAddress?.additionalDetails || "",
    };
  });

  const [mapCenter, setMapCenter] = useState([20, 0]);
  const [markerPosition, setMarkerPosition] = useState(null);

  const [phoneDialCode, setPhoneDialCode] = useState("");
  const [errors, setErrors] = useState({});
  const [verifyingAddress, setVerifyingAddress] = useState(false);
  const previewPosition = markerPosition || mapCenter;
  const mapEmbedUrl = buildMapEmbedUrl(previewPosition);

  // Fetch cart & countries on mount
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [cartRes, countriesRes] = await Promise.all([
          api.get("/cart"),
          api.get("/shipping/countries"),
        ]);

        if (cancelled) return;

        if (!cartRes.data.data.items || cartRes.data.data.items.length === 0) {
          toast.error("Your cart is empty", feedbackToastOptions);
          navigate("/cart");
          return;
        }

        setCart(cartRes.data.data);
        setCountries(countriesRes.data.data);

        const savedCountryCode = user?.shippingAddress?.countryCode;
        if (savedCountryCode) {
          const c = countriesRes.data.data.find(
            (country) => country.code === savedCountryCode,
          );
          if (c) setPhoneDialCode(c.dialCode);
        }

        if (
          user?.shippingAddress?.latitude &&
          user?.shippingAddress?.longitude
        ) {
          const pos = [
            user.shippingAddress.latitude,
            user.shippingAddress.longitude,
          ];
          setMapCenter(pos);
          setMarkerPosition(pos);
        }
      } catch (err) {
        if (!cancelled) {
          toast.error("Failed to load checkout data", feedbackToastOptions);
          navigate("/cart");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [navigate, user]);

  useEffect(() => {
    let cancelled = false;

    const tryCenterFromSaved = async () => {
      if (!user?.shippingAddress && !formData) return;

      const saved = user?.shippingAddress || {};
      const lat = saved.latitude;
      const lng = saved.longitude;

      if (Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
        const pos = [Number(lat), Number(lng)];
        setMapCenter(pos);
        setMarkerPosition(pos);
        return;
      }

      const parts = [
        formData?.address || saved.address,
        formData?.city || saved.city,
        formData?.state || saved.state,
        formData?.postalCode || saved.postalCode,
        formData?.country || saved.country,
      ]
        .filter(Boolean)
        .join(", ");

      if (!parts) return;

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            parts,
          )}&format=json&limit=1&addressdetails=0`,
        );
        const geo = await res.json();
        if (cancelled) return;
        if (geo && geo.length > 0) {
          const pos = [parseFloat(geo[0].lat), parseFloat(geo[0].lon)];
          setMapCenter(pos);
          setMarkerPosition(pos);
        }
      } catch (e) {
        // ignore geocode errors
      }
    };

    tryCenterFromSaved();

    return () => {
      cancelled = true;
    };
  }, [
    user?.shippingAddress,
    formData?.address,
    formData?.city,
    formData?.state,
    formData?.postalCode,
    formData?.country,
  ]);

  useEffect(() => {
    if (!user?.shippingAddress) return;

    setFormData((prev) => {
      const saved = user.shippingAddress || {};
      const next = { ...prev };

      if (!prev.fullName && saved.fullName) next.fullName = saved.fullName;
      if (!prev.country && saved.country) next.country = saved.country;
      if (!prev.countryCode && saved.countryCode)
        next.countryCode = saved.countryCode;
      if (!prev.state && saved.state) next.state = saved.state;
      if (!prev.stateCode && saved.stateCode)
        next.stateCode = saved.stateCode || prev.stateCode;
      if (!prev.city && saved.city) next.city = saved.city;
      if (!prev.postalCode && saved.postalCode)
        next.postalCode = saved.postalCode;
      if (!prev.address && saved.address) next.address = saved.address;
      if (!prev.phone && saved.phone) next.phone = saved.phone;
      if (!prev.additionalDetails && saved.additionalDetails)
        next.additionalDetails = saved.additionalDetails;

      return next;
    });
  }, [user?.shippingAddress]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleCountrySelect = async (country) => {
    setFormData((prev) => ({
      ...prev,
      country: country.name,
      countryCode: country.code,
      state: "",
      stateCode: "",
      city: "",
      phone: "",
    }));
    setPhoneDialCode(country.dialCode);
    setDropdownOpen(false);
    setCountrySearch("");
    if (errors.country) setErrors((prev) => ({ ...prev, country: null }));

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?country=${encodeURIComponent(country.name)}&format=json&limit=1`,
      );
      const data = await res.json();
      if (data && data.length > 0) {
        setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      }
    } catch (e) {
      // Ignore
    }
  };

  const formatPhoneLocal = (val) => {
    if (!formData.countryCode) return val;
    try {
      const phoneNumber = parsePhoneNumberFromString(val, formData.countryCode);
      if (phoneNumber) return phoneNumber.formatNational();
    } catch (e) {}
    return val;
  };

  const validateForm = async () => {
    // Construct full phone number
    let fullPhone = formData.phone;
    if (formData.phone) {
      try {
        const parsedPhone = parsePhoneNumberFromString(
          formData.phone,
          formData.countryCode,
        );
        if (parsedPhone?.isValid()) {
          fullPhone = parsedPhone.number;
        }
      } catch (e) {
        // Fall back to manual normalization below.
      }

      if (!fullPhone.startsWith("+")) {
        const normalizedDialCode = normalizeDialCode(phoneDialCode);
        const nationalDigits = formData.phone.replace(/[^\d]/g, "");
        fullPhone = `${normalizedDialCode}${nationalDigits}`;
      }
    }

    try {
      await api.post("/shipping/validate", {
        ...formData,
        phone: fullPhone.replace(/(?!^)\D/g, ""),
      });
      return { isValid: true, fullPhone };
    } catch (err) {
      if (err.response?.data?.errors) {
        const newErrors = {};
        err.response.data.errors.forEach((e) => {
          newErrors[e.field] = e.message;
        });
        setErrors(newErrors);
        toast.error("Please fix the highlighted errors", feedbackToastOptions);
      } else {
        toast.error("Validation failed", feedbackToastOptions);
      }
      return { isValid: false };
    }
  };

  const showSaveAddressModal = () => {
    return new Promise((resolve) => {
      // If no saved address at all
      if (!user?.shippingAddress?.country) {
        toast.custom(
          (t) => (
            <div
              className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ${
                t.visible
                  ? "bg-black/20 backdrop-blur-sm"
                  : "bg-transparent backdrop-blur-none pointer-events-none"
              }`}
            >
              <div
                className={`bg-paper border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 ${
                  t.visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
                }`}
              >
                <p className="font-semibold text-espresso mb-1.5 text-lg">
                  Save shipping info?
                </p>
                <p className="text-sm text-fog mb-6 leading-relaxed">
                  Save this address for future orders?
                </p>
                <div className="flex gap-3">
                  <button
                    className="btn-primary py-2.5 px-4 text-sm w-full font-medium"
                    onClick={() => {
                      toast.dismiss(t.id);
                      resolve("save");
                    }}
                  >
                    Save
                  </button>
                  <button
                    className="btn-outline py-2.5 px-4 text-sm w-full font-medium"
                    onClick={() => {
                      toast.dismiss(t.id);
                      resolve("skip");
                    }}
                  >
                    Skip
                  </button>
                </div>
              </div>
            </div>
          ),
          modalToastOptions,
        );
      }
      // If has saved address but it's different
      else if (
        isShippingAddressChanged(user.shippingAddress, formData, phoneDialCode)
      ) {
        toast.custom(
          (t) => (
            <div
              className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ${
                t.visible
                  ? "bg-black/20 backdrop-blur-sm"
                  : "bg-transparent backdrop-blur-none pointer-events-none"
              }`}
            >
              <div
                className={`bg-paper border border-border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 ${
                  t.visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
                }`}
              >
                <p className="font-semibold text-espresso mb-1.5 text-lg">
                  Update saved address?
                </p>
                <p className="text-sm text-fog mb-6 leading-relaxed">
                  You've modified your shipping details. Update your profile?
                </p>
                <div className="flex gap-3">
                  <button
                    className="btn-primary py-2.5 px-4 text-sm w-full font-medium"
                    onClick={() => {
                      toast.dismiss(t.id);
                      resolve("save");
                    }}
                  >
                    Update
                  </button>
                  <button
                    className="btn-outline py-2.5 px-4 text-sm w-full font-medium"
                    onClick={() => {
                      toast.dismiss(t.id);
                      resolve("skip");
                    }}
                  >
                    Just this order
                  </button>
                </div>
              </div>
            </div>
          ),
          modalToastOptions,
        );
      } else {
        // Unchanged
        resolve("skip");
      }
    });
  };

  
  const verifyAddressLine = () => {
    return new Promise(async (resolve) => {
      if (!formData.address || !formData.city || !formData.countryCode) {
        resolve(true);
        return;
      }

      setVerifyingAddress(true);

      try {
        const queryParts = [formData.address, formData.city, formData.state]
          .filter(Boolean)
          .join(", ");

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            queryParts,
          )}&countrycodes=${formData.countryCode.toLowerCase()}&format=json&addressdetails=1&limit=1`,
        );
        const data = await res.json();

        if (!data || data.length === 0) {
          toast.custom(
            (t) => (
              <div
                className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300 ${
                  t.visible
                    ? "bg-black/20 backdrop-blur-sm"
                    : "bg-transparent backdrop-blur-none pointer-events-none"
                }`}
              >
                <div
                  className={`max-w-sm w-full mx-4 p-6 rounded-2xl shadow-[0_8px_30px_rgba(245,158,11,0.15)] bg-[#fffbeb] border border-[#f59e0b] transition-all duration-300 ${
                    t.visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldAlert className="w-6 h-6 text-amber-500 shrink-0" />
                    <p className="font-semibold text-espresso text-lg">
                      Address Verification
                    </p>
                  </div>
                  <p className="text-sm text-fog mb-6 leading-relaxed">
                    We couldn't fully verify this address in{" "}
                    <strong className="font-semibold text-espresso">
                      {formData.city}
                    </strong>
                    ,{" "}
                    <strong className="font-semibold text-espresso">
                      {formData.state}
                    </strong>
                    . Please confirm it is correct before proceeding.
                  </p>
                  <div className="flex gap-3">
                    <button
                      className="btn-primary py-2.5 px-4 text-sm w-full font-medium"
                      onClick={() => {
                        toast.dismiss(t.id);
                        resolve(true); 
                      }}
                    >
                      Yes, it's correct
                    </button>
                    <button
                      className="btn-outline py-2.5 px-4 text-sm w-full flex items-center justify-center gap-1.5 font-medium"
                      onClick={() => {
                        toast.dismiss(t.id);
                        resolve(false);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                      I'll Fix It
                    </button>
                  </div>
                </div>
              </div>
            ),
            modalToastOptions,
          );
        } else {
          resolve(true);
        }
      } catch (err) {
        resolve(true);
      } finally {
        setVerifyingAddress(false);
      }
    });
  };

  const handleCheckout = async () => {
    setCheckoutBusy(true);

    if (
      formData.additionalDetails &&
      formData.additionalDetails.trim().length > 500
    ) {
      toast.error(
        "Delivery instructions cannot exceed 500 characters.",
        feedbackToastOptions,
      );
      setCheckoutBusy(false);
      return;
    }

    
    const addressOk = await verifyAddressLine();
    if (!addressOk) {
      setCheckoutBusy(false);
      return;
    }

    const { isValid, fullPhone } = await validateForm();
    if (!isValid) {
      setCheckoutBusy(false);
      return;
    }

    const finalShippingData = {
      ...formData,
      phone: fullPhone,
      latitude: markerPosition?.[0],
      longitude: markerPosition?.[1],
    };

    const saveDecision = await showSaveAddressModal();
    if (saveDecision === "save") {
      try {
        const { data } = await api.post("/shipping/save", finalShippingData);
        updateUser(data.data.user);
        toast.success("Address saved to profile", feedbackToastOptions);
      } catch (err) {
        toast.error(
          "Failed to save address to profile, continuing with order...",
          feedbackToastOptions,
        );
      }
    }

    try {
      const { data } = await api.post("/cart/checkout-session", {
        notes: formData.additionalDetails,
        shippingAddress: finalShippingData,
      });
      const url = data.data?.url;
      if (url) {
        window.location.href = url;
      } else {
        toast.error("No payment URL returned", feedbackToastOptions);
        setCheckoutBusy(false);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Checkout failed",
        feedbackToastOptions,
      );
      setCheckoutBusy(false);
    }
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      toast.error(
        "Geolocation is not supported by your browser",
        feedbackToastOptions,
      );
      return;
    }

    setGeolocationBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setMapCenter([latitude, longitude]);
        setMarkerPosition([latitude, longitude]);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          );
          const data = await res.json();
          if (data && data.address) {
            const countryCode = data.address.country_code?.toUpperCase();
            const countryObj = countries.find((c) => c.code === countryCode);
            const resolvedAddress = buildGeoAddress(data);

            setFormData((prev) => ({
              ...prev,
              country: countryObj?.name || data.address.country || prev.country,
              countryCode: countryObj?.code || prev.countryCode,
              city:
                data.address.city ||
                data.address.town ||
                data.address.village ||
                prev.city,
              state: data.address.state || prev.state,
              postalCode: data.address.postcode || prev.postalCode,
              address: resolvedAddress || prev.address,
              phone: "",
            }));

            if (countryObj) {
              setPhoneDialCode(countryObj.dialCode);
            }

            setErrors({});
            toast.success("Location auto-filled", feedbackToastOptions);
          }
        } catch (err) {
          toast.error("Failed to fetch address details", feedbackToastOptions);
        } finally {
          setGeolocationBusy(false);
        }
      },
      (error) => {
        setGeolocationBusy(false);
        if (error.code === 1)
          toast.error(
            "Location permission denied. Please enter manually.",
            feedbackToastOptions,
          );
        else
          toast.error(
            "Could not determine your location",
            feedbackToastOptions,
          );
      },
    );
  };

  const filteredCountries = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase()),
  );

  const selectedCountryObj = countries.find(
    (c) => c.code === formData.countryCode,
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas pt-24 pb-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-tan animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-espresso pt-20 sm:pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* Step Indicator */}
        <div className="relative max-w-md sm:max-w-lg mx-auto mb-8 sm:mb-12">
          <div className="step-line"></div>
          <div className="step-line-active" style={{ width: "50%" }}></div>
          <div className="relative z-10 flex justify-between gap-2 sm:gap-0">
            <div className="flex min-w-0 flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-tan text-paper flex items-center justify-center font-medium shadow-sm">
                <CheckCircle className="w-4 h-4" />
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-espresso mt-2 uppercase tracking-wide text-center leading-tight">
                Cart
              </span>
            </div>
            <div className="flex min-w-0 flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-tan text-paper flex items-center justify-center font-medium shadow-soft ring-4 ring-canvas">
                2
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-espresso mt-2 uppercase tracking-wide text-center leading-tight">
                Shipping
              </span>
            </div>
            <div className="flex min-w-0 flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-paper border-2 border-border text-fog flex items-center justify-center font-medium">
                3
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-fog mt-2 uppercase tracking-wide text-center leading-tight">
                Payment
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 lg:gap-10">
          {/* Left Column - Form */}
          <div className="lg:col-span-8 space-y-6 md:space-y-8">
            <div className="bg-paper border border-border rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-tan" />
                  Shipping Information
                </h2>
                <button
                  onClick={handleGeolocation}
                  disabled={geolocationBusy}
                  className="btn-outline w-full sm:w-auto justify-center py-2 px-4 text-xs flex items-center gap-2"
                >
                  {geolocationBusy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4" />
                  )}
                  Use Current Location
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Full Name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-espresso mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`field ${errors.fullName ? "field-error" : ""}`}
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && (
                    <p className="text-xs text-rust mt-1.5">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Country Custom Dropdown */}
                <div className="md:col-span-2 relative" ref={dropdownRef}>
                  <label className="block text-sm font-medium text-espresso mb-1.5">
                    Country *
                  </label>
                  <div
                    className={`field flex items-center justify-between cursor-pointer ${errors.country ? "field-error" : ""}`}
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    {selectedCountryObj ? (
                      <span className="flex min-w-0 flex-1 items-center gap-2 pr-2">
                        <CountryFlag country={selectedCountryObj} />
                        <span className="truncate">
                          {selectedCountryObj.name}
                        </span>
                      </span>
                    ) : (
                      <span className="min-w-0 flex-1 truncate text-fog">
                        Select delivery country
                      </span>
                    )}
                    <ChevronDown
                      className={`w-4 h-4 text-fog transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                    />
                  </div>

                  {dropdownOpen && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-paper border border-border rounded-xl shadow-card overflow-hidden">
                      <div className="p-2 border-b border-border flex items-center gap-2">
                        <Search className="w-4 h-4 text-fog" />
                        <input
                          type="text"
                          placeholder="Search countries..."
                          className="w-full bg-transparent text-sm focus:outline-none"
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div
                        className="max-h-60 overflow-y-auto country-dropdown-menu"
                        onWheelCapture={(e) => e.stopPropagation()}
                        onTouchMoveCapture={(e) => e.stopPropagation()}
                      >
                        {filteredCountries.map((country) => (
                          <div
                            key={country.code}
                            className="px-4 py-2.5 hover:bg-linen cursor-pointer flex items-center gap-3 text-sm"
                            onClick={() => handleCountrySelect(country)}
                          >
                            <CountryFlag country={country} />
                            <span>{country.name}</span>
                            <span className="text-fog text-xs ml-auto">
                              {country.code}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {errors.country && (
                    <p className="text-xs text-rust mt-1.5">{errors.country}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-espresso mb-1.5">
                    Phone Number *
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="w-full sm:w-24 shrink-0 field bg-linen/50 flex items-center justify-center font-medium text-fog select-none">
                      {phoneDialCode || "—"}
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formatPhoneLocal(formData.phone)}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, "");
                        const nationalLimit = getNationalPhoneLimit(
                          formData.countryCode,
                        );
                        const nextPhone = nationalLimit
                          ? digitsOnly.slice(0, nationalLimit)
                          : digitsOnly;

                        if (formData.countryCode && nextPhone !== digitsOnly) {
                          return;
                        }

                        setFormData((prev) => ({ ...prev, phone: nextPhone }));
                        if (errors.phone)
                          setErrors((prev) => ({ ...prev, phone: null }));
                      }}
                      maxLength={
                        getNationalPhoneLimit(formData.countryCode) || undefined
                      }
                      className={`field flex-1 ${errors.phone ? "field-error" : ""}`}
                      placeholder="Phone number"
                      disabled={!formData.countryCode}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-rust mt-1.5">{errors.phone}</p>
                  )}
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-espresso mb-1.5">
                    Address Line *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`field ${errors.address ? "field-error" : ""}`}
                    placeholder="Street address, company name, etc."
                  />
                  {errors.address && (
                    <p className="text-xs text-rust mt-1.5">{errors.address}</p>
                  )}
                </div>

                {/* State/Province */}
                <div>
                  <label className="block text-sm font-medium text-espresso mb-1.5">
                    State / Province *
                  </label>
                  <div className="relative">
                    <select
                      name="stateCode"
                      value={formData.stateCode}
                      onChange={(e) => {
                        const selectedStateCode = e.target.value;
                        const stateName =
                          e.target.options[e.target.selectedIndex].text;
                        setFormData((prev) => ({
                          ...prev,
                          stateCode: selectedStateCode,
                          state: selectedStateCode ? stateName : "",
                          city: "",
                        }));
                        if (errors.state) {
                          setErrors((prev) => ({ ...prev, state: null }));
                        }
                      }}
                      disabled={!formData.countryCode}
                      className={`field appearance-none w-full ${errors.state ? "field-error" : ""} ${!formData.stateCode ? "text-fog" : ""}`}
                    >
                      <option value="" disabled hidden>
                        Select State / Province
                      </option>
                      {formData.countryCode &&
                        State.getStatesOfCountry(formData.countryCode).map(
                          (state) => (
                            <option
                              key={state.isoCode}
                              value={state.isoCode}
                              className="text-espresso"
                            >
                              {state.name}
                            </option>
                          ),
                        )}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fog pointer-events-none" />
                  </div>
                  {errors.state && (
                    <p className="text-xs text-rust mt-1.5">{errors.state}</p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-espresso mb-1.5">
                    City *
                  </label>
                  <div className="relative">
                    <select
                      name="city"
                      value={formData.city}
                      onChange={(e) => {
                        handleInputChange(e);
                        if (errors.city) {
                          setErrors((prev) => ({ ...prev, city: null }));
                        }
                      }}
                      disabled={!formData.stateCode}
                      className={`field appearance-none w-full ${errors.city ? "field-error" : ""} ${!formData.city ? "text-fog" : ""}`}
                    >
                      <option value="" disabled hidden>
                        Select City
                      </option>
                      {formData.stateCode &&
                        City.getCitiesOfState(
                          formData.countryCode,
                          formData.stateCode,
                        ).map((city) => (
                          <option
                            key={city.name}
                            value={city.name}
                            className="text-espresso"
                          >
                            {city.name}
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fog pointer-events-none" />
                  </div>
                  {errors.city && (
                    <p className="text-xs text-rust mt-1.5">{errors.city}</p>
                  )}
                </div>

                {/* Postal Code */}
                <div>
                  <label className="block text-sm font-medium text-espresso mb-1.5">
                    Postal / Zip Code *
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className={`field ${errors.postalCode ? "field-error" : ""}`}
                  />
                  {errors.postalCode && (
                    <p className="text-xs text-rust mt-1.5">
                      {errors.postalCode}
                    </p>
                  )}
                </div>

                {/* Additional Details */}
                <div className="md:col-span-2 mt-2">
                  <label className="block text-sm font-medium text-espresso mb-1.5">
                    Additional Delivery Instructions (Optional, 500 characters
                    max)
                  </label>
                  <textarea
                    name="additionalDetails"
                    value={formData.additionalDetails}
                    onChange={handleInputChange}
                    className="field min-h-[80px] resize-y"
                    maxLength={500}
                    placeholder="Gate codes, specific building details, etc."
                  />
                  <p className="mt-1.5 text-[11px] text-fog">
                    This note is included with the order and must stay within
                    500 characters.
                  </p>
                </div>
              </div>
            </div>

            {/* Map Section */}
            <div className="bg-paper border border-border rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm">
              <h3 className="text-base sm:text-lg font-semibold mb-2">
                Confirm Delivery Location
              </h3>
              <p className="text-sm text-fog mb-5">
                Preview the delivery area selected from your address details.
              </p>

              <div className="h-[220px] sm:h-[260px] md:h-[300px] w-full rounded-xl overflow-hidden border border-border bg-linen/40 relative">
                <iframe
                  title="Delivery location map preview"
                  src={mapEmbedUrl}
                  className="h-full w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-paper/90 border border-border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-fog shadow-sm">
                  Map preview
                </div>
              </div>

              <p className="mt-3 text-xs text-fog">
                Use the country, city, state, and postal code fields to refine
                the address used for checkout.
              </p>
            </div>
          </div>

          {/* Right Column - Summary & Actions */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28 self-start">
            <div className="card-linen border border-border/60 rounded-2xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4 pb-4 border-b border-border">
                Order Summary
              </h3>

              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2 country-dropdown-menu">
                {cart?.items.map((item) => (
                  <div key={item.product._id} className="flex gap-3 text-sm">
                    <div className="w-12 h-12 bg-paper rounded-lg border border-border overflow-hidden shrink-0">
                      {item.product.images?.[0]?.url ? (
                        <img
                          src={item.product.images[0].url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-linen" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-espresso truncate">
                        {item.productName}
                      </p>
                      <p className="text-fog text-xs mt-0.5">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="font-medium">
                      {formatCurrency(
                        item.price * item.quantity,
                        user?.preferredCurrency,
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-fog">Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(cart?.totalAmount, user?.preferredCurrency)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-fog">Shipping</span>
                  <span className="text-espresso font-medium">
                    Calculated at next step
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkoutBusy}
                className="btn-primary w-full py-3.5 flex items-center justify-center gap-2"
              >
                {checkoutBusy || verifyingAddress ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {verifyingAddress ? "Verifying address…" : "Processing..."}
                  </>
                ) : (
                  "Proceed to Payment"
                )}
              </button>

              <div className="mt-4 flex items-start gap-2 text-xs text-fog bg-paper p-3 rounded-xl border border-border">
                <AlertCircle className="w-4 h-4 shrink-0 text-tan mt-0.5" />
                <p>
                  You will be redirected to our secure payment gateway.
                  International shipping costs will be applied.
                </p>
              </div>
            </div>

            {/* Support Info */}
            <div className="bg-paper border border-border rounded-2xl p-4 sm:p-6 shadow-sm">
              <h4 className="font-medium text-espresso mb-4 text-sm sm:text-base">
                International Support
              </h4>
              <div className="space-y-3 text-sm text-fog">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-tan" />
                  <a
                    href="mailto:crisitiano678@gmail.com"
                    className="hover:text-espresso"
                  >
                    crisitiano678@gmail.com
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-tan" />
                  <a href="tel:+923284117428" className="hover:text-espresso">
                    +92 328 4117428
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-tan" />
                  <span>Timezone: PKT (UTC+5)</span>
                </div>
                <div className="mt-4 pt-3 border-t border-border text-xs italic">
                  * International orders may take 7–14 business days for
                  delivery depending on customs.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE = "https://cravewheels.com";
const DEFAULT_IMG =
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=80";

// Ordered list of route rules. First match wins.
const RULES = [
  {
    test: (p) => p === "/",
    seo: {
      title: "Cravewheels — Video Food Delivery | Order from Local Restaurants",
      desc: "Swipe through crave-worthy dish clips from local restaurants, then order delivery or pickup in seconds. Schedule orders, apply promo codes, and track your delivery live.",
      type: "website",
    },
  },
  {
    test: (p) => p.startsWith("/item/"),
    seo: {
      title: "Dish Video & Details | Cravewheels",
      desc: "Watch a crave-worthy video of this dish and order it for delivery or pickup from a local restaurant on Cravewheels.",
      type: "article",
    },
  },
  {
    test: (p) => p.startsWith("/restaurant/"),
    seo: {
      title: "Restaurant Profile & Video Menu | Cravewheels",
      desc: "Browse a restaurant's video menu, reviews, and live stream, then order delivery or pickup on Cravewheels.",
      type: "profile",
    },
  },
  {
    test: (p) => p.startsWith("/post/"),
    seo: {
      title: "Video Post | Cravewheels",
      desc: "Watch and comment on video posts from restaurants and creators on Cravewheels.",
      type: "article",
    },
  },
  {
    test: (p) => p === "/search",
    seo: {
      title: "Search Restaurants & Dishes | Cravewheels",
      desc: "Search for restaurants and dishes near you on Cravewheels, the video-first food delivery marketplace.",
      type: "website",
    },
  },
  {
    test: (p) => p === "/cart",
    seo: {
      title: "Your Cart & Checkout | Cravewheels",
      desc: "Review your cart, choose delivery or pickup, add a tip and promo code, and place your order on Cravewheels.",
      type: "website",
    },
  },
  {
    test: (p) => p === "/orders" || p.startsWith("/order/"),
    seo: {
      title: "Your Orders & Live Tracking | Cravewheels",
      desc: "View your order history and track every delivery live from kitchen to door on Cravewheels.",
      type: "website",
    },
  },
  {
    test: (p) => p === "/profile",
    seo: {
      title: "Your Profile | Cravewheels",
      desc: "Manage your Cravewheels profile, saved dishes, likes, and activity history.",
      type: "profile",
    },
  },
  {
    test: (p) => p.startsWith("/driver"),
    seo: {
      title: "Driver Dashboard | Cravewheels",
      desc: "Cravewheels drivers: go online, accept deliveries, navigate turn-by-turn, and track your earnings.",
      type: "website",
    },
  },
  {
    test: (p) => p === "/account",
    seo: {
      title: "Account Settings | Cravewheels",
      desc: "Manage your Cravewheels account settings, preferences, and connected services.",
      type: "website",
    },
  },
  {
    test: (p) => p === "/about",
    seo: {
      title: "About Cravewheels — Video Food Delivery Marketplace",
      desc: "Cravewheels is a video-first food delivery marketplace connecting hungry customers, restaurants, drivers, and creators. Learn how it works and join us.",
      type: "website",
    },
  },
  {
    test: (p) => p === "/privacy",
    seo: {
      title: "Privacy & Security Policy | Cravewheels",
      desc: "Read the Cravewheels privacy and security policy — how we collect, use, and protect your data.",
      type: "article",
    },
  },
  {
    test: (p) => p === "/legal",
    seo: {
      title: "Legal Hub — Terms & Policies | Cravewheels",
      desc: "Cravewheels legal hub: terms of service, privacy, driver and restaurant policies, and platform guidelines.",
      type: "article",
    },
  },
  {
    test: (p) => p.startsWith("/apply/"),
    seo: {
      title: "Apply to Join Cravewheels — Driver, Restaurant, or Creator",
      desc: "Apply to join Cravewheels as a delivery driver, restaurant partner, or creator and start earning.",
      type: "website",
    },
  },
  {
    test: (p) => p.startsWith("/earn/"),
    seo: {
      title: "Earn with Cravewheels | Cravewheels",
      desc: "Discover ways to earn on Cravewheels — drive, refer, or partner with local restaurants.",
      type: "website",
    },
  },
  {
    test: (p) => p === "/admin-dashboard",
    seo: {
      title: "Admin Dashboard | Cravewheels",
      desc: "Cravewheels admin dashboard for managing restaurants, drivers, orders, and platform operations.",
      type: "website",
    },
  },
  {
    test: (p) => p === "/restaurant-dashboard",
    seo: {
      title: "Restaurant Dashboard | Cravewheels",
      desc: "Manage your restaurant's video menu, orders, specials, and profile on Cravewheels.",
      type: "website",
    },
  },
  {
    test: (p) => p === "/creator-dashboard",
    seo: {
      title: "Creator Dashboard | Cravewheels",
      desc: "Track your referral earnings, shares, and referred customers as a Cravewheels creator.",
      type: "website",
    },
  },
  {
    test: (p) => p === "/discovery-map",
    seo: {
      title: "Discovery Map — Find Restaurants Near You | Cravewheels",
      desc: "Explore a full-screen map of restaurants delivering to your area on Cravewheels.",
      type: "website",
    },
  },
  {
    test: (p) => p === "/login",
    seo: {
      title: "Log In | Cravewheels",
      desc: "Log in to your Cravewheels account to order food and track deliveries.",
      type: "website",
    },
  },
  {
    test: (p) => p === "/register",
    seo: {
      title: "Create Your Account | Cravewheels",
      desc: "Sign up for Cravewheels and start discovering and ordering food through immersive video.",
      type: "website",
    },
  },
];

const FALLBACK = {
  title: "Cravewheels — Video Food Delivery",
  desc: "Cravewheels is a video-first food delivery marketplace. Swipe through dish clips from local restaurants and order delivery or pickup in seconds.",
  type: "website",
};

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel, href, hreflang) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
  if (hreflang) el.setAttribute("hreflang", hreflang);
}

function setJsonLd(id, json) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(json);
}

export default function RouteSeo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const rule = RULES.find((r) => r.test(pathname)) || {};
    const seo = { ...FALLBACK, ...rule.seo };
    const canonical = SITE + pathname;

    document.title = seo.title;
    setMeta("name", "description", seo.desc);
    setLink("canonical", canonical);

    setMeta("property", "og:title", seo.title);
    setMeta("property", "og:description", seo.desc);
    setMeta("property", "og:url", canonical);
    setMeta("property", "og:type", seo.type);
    setMeta("property", "og:image", DEFAULT_IMG);

    setMeta("name", "twitter:title", seo.title);
    setMeta("name", "twitter:description", seo.desc);
    setMeta("name", "twitter:image", DEFAULT_IMG);

    setJsonLd("route-breadcrumbs", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
        ...(pathname !== "/"
          ? [{ "@type": "ListItem", position: 2, name: seo.title.split(" | ")[0], item: canonical }]
          : []),
      ],
    });
  }, [pathname]);

  return null;
}
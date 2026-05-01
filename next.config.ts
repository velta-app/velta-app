import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
	swSrc: "src/app/sw.ts",
	swDest: "public/sw.js",
	cacheOnNavigation: true,
	reloadOnOnline: true,
	disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
	allowedDevOrigins: ["192.168.9.36"],
};

export default withSerwist(nextConfig);

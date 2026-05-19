import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcryptjs"],
  transpilePackages: ["@axis/currency", "@axis/sifen"],
};

export default withNextIntl(nextConfig);

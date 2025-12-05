import { withBaml } from "@boundaryml/baml-nextjs-plugin";

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  // Allow webpack config from withBaml to work alongside Turbopack
  turbopack: {},
};

export default withBaml()(nextConfig);

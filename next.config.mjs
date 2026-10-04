/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare PagesにはNode.jsサーバーを常駐させず、
  // ビルド時に生成したHTML/CSS/JSの静的ファイルをそのまま配信する。
  // このアプリはAPI RoutesやServer Actionsなどサーバー機能を使っていないため、
  // 静的書き出し（output: "export"）が利用できる。
  output: "export",
};

export default nextConfig;

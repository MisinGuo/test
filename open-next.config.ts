import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const isAliyunESA = process.env.ALIYUN_ESA === "true";

export default defineCloudflareConfig(
  isAliyunESA
    ? {
        // ESA 没有 Durable Objects，禁用依赖 cloudflare:workers 的缓存组件，
        // 避免 ESA 打包器报 "Could not resolve cloudflare:workers" 错误
        incrementalCache: "dummy",
        tagCache: "dummy",
        queue: "dummy",
      }
    : {
        // Cloudflare Workers 使用默认配置（Durable Objects 全功能缓存）
      }
);

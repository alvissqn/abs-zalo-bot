// ABS-Zalo-Bot Smart Sticker Pool & Curation Engine
//
// Cơ chế tự động tìm kiếm, làm giàu và lựa chọn sticker Zalo miễn phí khôn khéo
// phục vụ giao tiếp kinh doanh và chăm sóc khách hàng tự nhiên như con người.

import fs from "node:fs";
import path from "node:path";
import { classifyEngagementSafety } from "./personal_engagement.js";

// Bộ sticker miễn phí chuẩn Zalo phân loại theo intent kinh doanh & CSKH
export const CURATED_FREE_STICKERS = Object.freeze({
  greeting: [
    { id: 10751, cateId: 27703, type: 1, name: "Xin chào vẫy tay", intent: "greeting" },
    { id: 10752, cateId: 27703, type: 1, name: "Hello năng lượng", intent: "greeting" },
    { id: 10815, cateId: 27708, type: 1, name: "Cúi chào lịch thiệp", intent: "greeting" }
  ],
  thank_you: [
    { id: 10755, cateId: 27703, type: 1, name: "Cảm ơn chắp tay", intent: "thank_you" },
    { id: 10756, cateId: 27703, type: 1, name: "Biết ơn thả tim", intent: "thank_you" },
    { id: 10820, cateId: 27708, type: 1, name: "Thank you cúi đầu", intent: "thank_you" }
  ],
  deal_closed: [
    { id: 10760, cateId: 27703, type: 1, name: "Bắt tay hợp tác", intent: "deal_closed" },
    { id: 10761, cateId: 27703, type: 1, name: "Chúc mừng thành công", intent: "deal_closed" },
    { id: 10825, cateId: 27708, type: 1, name: "Tuyệt vời vỗ tay", intent: "deal_closed" }
  ],
  ok_agree: [
    { id: 10758, cateId: 27703, type: 1, name: "OK ngón tay", intent: "ok_agree" },
    { id: 10759, cateId: 27703, type: 1, name: "Nhất trí đồng ý", intent: "ok_agree" },
    { id: 10822, cateId: 27708, type: 1, name: "Đã nhận rõ", intent: "ok_agree" }
  ],
  cheer_energy: [
    { id: 10765, cateId: 27703, type: 1, name: "Cố lên quyết tâm", intent: "cheer_energy" },
    { id: 10766, cateId: 27703, type: 1, name: "Năng lượng tích cực", intent: "cheer_energy" }
  ],
  funny_laugh: [
    { id: 10770, cateId: 27703, type: 1, name: "Cười vui vẻ", intent: "funny_laugh" },
    { id: 10830, cateId: 27708, type: 1, name: "Haha sảng khoái", intent: "funny_laugh" }
  ]
});

export class SmartStickerPool {
  constructor({ cacheFilePath = "", api = null } = {}) {
    this.cacheFilePath = cacheFilePath;
    this.api = api;
    this.dynamicStickers = new Map();
    this.loadCache();
  }

  loadCache() {
    if (!this.cacheFilePath || !fs.existsSync(this.cacheFilePath)) return;
    try {
      const raw = fs.readFileSync(this.cacheFilePath, "utf8");
      const data = JSON.parse(raw);
      if (typeof data === "object" && data !== null) {
        for (const [intent, list] of Object.entries(data)) {
          if (Array.isArray(list)) this.dynamicStickers.set(intent, list);
        }
      }
    } catch {
      // Ignored: fallback to memory cache
    }
  }

  saveCache() {
    if (!this.cacheFilePath) return;
    try {
      const data = Object.fromEntries(this.dynamicStickers.entries());
      fs.mkdirSync(path.dirname(this.cacheFilePath), { recursive: true });
      fs.writeFileSync(this.cacheFilePath, JSON.stringify(data, null, 2), "utf8");
    } catch {
      // Ignored
    }
  }

  async refreshFreeStickers(keywords = ["chào", "cảm ơn", "ok", "chúc mừng"]) {
    if (!this.api || typeof this.api.searchSticker !== "function") return 0;
    let added = 0;
    for (const kw of keywords) {
      try {
        const res = await this.api.searchSticker(kw);
        const list = Array.isArray(res) ? res : (res?.items || res?.result || []);
        if (Array.isArray(list) && list.length > 0) {
          const intent = this.inferIntentFromKeyword(kw);
          const current = this.dynamicStickers.get(intent) || [];
          for (const item of list) {
            const sid = Number(item.sticker_id || item.id);
            const cid = Number(item.cate_id || item.cateId || item.catId || 0);
            const stype = Number(item.type || item.sticker_type || 1);
            if (sid > 0 && !current.some(s => s.id === sid)) {
              current.push({ id: sid, cateId: cid, type: stype, name: `${kw} sticker`, intent });
              added++;
            }
          }
          this.dynamicStickers.set(intent, current);
        }
      } catch {
        // Continue next keyword
      }
    }
    if (added > 0) this.saveCache();
    return added;
  }

  inferIntentFromKeyword(kw = "") {
    const k = String(kw || "").toLowerCase();
    if (k.includes("chào") || k.includes("hello")) return "greeting";
    if (k.includes("cảm ơn") || k.includes("thanks")) return "thank_you";
    if (k.includes("chúc") || k.includes("mừng")) return "deal_closed";
    if (k.includes("ok") || k.includes("nhất trí")) return "ok_agree";
    return "cheer_energy";
  }

  pickStickerForContext(text = "", { isFirstMessage = false, customerSentSticker = false, random = Math.random } = {}) {
    const input = String(text || "").normalize("NFKC").toLowerCase().trim();
    if (classifyEngagementSafety(input) !== "normal") return null;

    // Không spam sticker: chỉ gửi khi khách gửi sticker trước, hoặc tin chào đầu, hoặc chốt deal, hoặc cảm ơn
    let intent = null;
    if (customerSentSticker) {
      intent = "greeting";
    } else if (/(?:chốt|đặt\s*cọc|thanh\s*toán\s*xong|thành\s*công|ký\s*hợp\s*đồng)/iu.test(input)) {
      intent = "deal_closed";
    } else if (/(?:cảm\s*ơn|tks|thanks|cám\s*ơn|biết\s*ơn)/iu.test(input)) {
      intent = "thank_you";
    } else if (isFirstMessage && /^(?:chào|hello|hi|a\s*lô)/iu.test(input)) {
      intent = "greeting";
    } else if (/^(?:ok|nhất\s*trí|duyệt|rồi\s*nhe)/iu.test(input)) {
      intent = "ok_agree";
    } else if (/(?:haha|kkk|vui\s*quá|cười\s*xỉu)/iu.test(input)) {
      intent = "funny_laugh";
    }

    if (!intent) return null;

    // Xác suất gửi: 60% gửi để giữ sự tinh tế, không làm khách bị phiền
    if (random() > 0.60) return null;

    const dynamicList = this.dynamicStickers.get(intent) || [];
    const curatedList = CURATED_FREE_STICKERS[intent] || [];
    const candidatePool = [...dynamicList, ...curatedList];
    if (candidatePool.length === 0) return null;

    const chosen = candidatePool[Math.floor(random() * candidatePool.length)];
    return { ...chosen };
  }
}

import test from "node:test";
import assert from "node:assert/strict";
import { SmartStickerPool, CURATED_FREE_STICKERS } from "../src/zalo_sticker_pool.js";

test("SmartStickerPool picks curated sticker for business context", () => {
  const pool = new SmartStickerPool();
  
  // Test deal closed context
  const sticker = pool.pickStickerForContext("Mình đã thanh toán cọc thành công", { random: () => 0.1 });
  assert.ok(sticker);
  assert.equal(sticker.intent, "deal_closed");
  
  // Test thank you context
  const thanksSticker = pool.pickStickerForContext("Cảm ơn shop nhiều nha", { random: () => 0.1 });
  assert.ok(thanksSticker);
  assert.equal(thanksSticker.intent, "thank_you");
  
  // Test sensitive safety -> zero sticker
  const sensitiveSticker = pool.pickStickerForContext("Đơn hàng bị lỗi hỏng vỡ hết rồi shop ơi", { random: () => 0.1 });
  assert.equal(sensitiveSticker, null);
});

test("SmartStickerPool respects random probability constraint", () => {
  const pool = new SmartStickerPool();
  // If random > 0.60, it will not send
  const skipped = pool.pickStickerForContext("Cảm ơn shop nhiều", { random: () => 0.95 });
  assert.equal(skipped, null);
});

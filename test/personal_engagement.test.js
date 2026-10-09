import test from "node:test";
import assert from "node:assert/strict";
import {
  buildFriendRequestMessage,
  classifyEngagementSafety,
  firstContactReplyInstruction,
  selectInboundReaction,
  ZALO_REACTION_CODES
} from "../src/personal_engagement.js";

test("personal engagement never reacts cheerfully to sensitive messages", () => {
  assert.equal(classifyEngagementSafety("Cảm ơn nhưng em đang rất buồn"), "sensitive");
  assert.equal(selectInboundReaction("Cảm ơn nhưng em đang rất buồn", { deterministic: true }), "");
  assert.equal(selectInboundReaction("Hệ thống bị lỗi thanh toán rồi, tiền đâu?", { deterministic: true }), "");
});

test("personal engagement selects contextual acknowledgement reactions (deterministic)", () => {
  assert.equal(selectInboundReaction("Cảm ơn Amon nhiều ❤️", { deterministic: true }), "heart");
  assert.equal(selectInboundReaction("Chào Amon", { deterministic: true }), "like");
  assert.equal(selectInboundReaction("Haha vui quá em ơi", { deterministic: true }), "haha");
  assert.equal(selectInboundReaction("Bot xịn và đỉnh quá", { deterministic: true }), "cool");
  assert.equal(selectInboundReaction("Ok duyệt triển khai nhé em", { deterministic: true }), "ok");
  assert.equal(selectInboundReaction("Thật á ghê vậy", { deterministic: true }), "wow");
  assert.equal(selectInboundReaction("Giúp mình sửa hợp đồng này", { deterministic: true }), "");
});

test("personal engagement exhibits human-like non-deterministic and diverse reactions", () => {
  // Test xác suất ngẫu nhiên: khi random trả về giá trị thấp (chọn thả)
  const fakeRandomLow = () => 0.1;
  const reaction1 = selectInboundReaction("Cảm ơn bạn nhiều nha", { random: fakeRandomLow });
  assert.ok(["heart", "pray", "thanks", "rose", "peace"].includes(reaction1));

  const reactionLaugh = selectInboundReaction("Haha cười đau bụng kkk", { random: fakeRandomLow });
  assert.ok(["haha", "tears_of_joy", "big_smile", "big_laugh", "wink"].includes(reactionLaugh));

  // Test khi random trả về giá trị cao (> xác suất ngưỡng): bot không thả reaction, hành xử tự nhiên
  const fakeRandomHigh = () => 0.99;
  const skippedReaction = selectInboundReaction("Cảm ơn bạn nhiều nha", { random: fakeRandomHigh });
  assert.equal(skippedReaction, "");

  // Mọi mã reaction sinh ra đều phải nằm trong danh mục Zalo chuẩn
  for (let i = 0; i < 20; i++) {
    const r = selectInboundReaction("Ok chốt đơn nha em", { random: Math.random });
    if (r) {
      assert.ok(r in ZALO_REACTION_CODES, `Reaction code '${r}' must be in ZALO_REACTION_CODES`);
    }
  }
});

test("personal engagement offers bounded reusable copy", () => {
  assert.match(buildFriendRequestMessage("Amon"), /Amon/u);
  assert.match(firstContactReplyInstruction("Amon"), /lượt DM đầu tiên/u);
});

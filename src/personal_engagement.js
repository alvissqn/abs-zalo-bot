// Reusable, transport-agnostic engagement policy for Personal Zalo agents.
// It decides intent only; an account adapter remains responsible for API calls.

const CRITICAL = /(?:tự\s*(?:tử|hại|vẫn)|không\s+muốn\s+(?:sống|tồn\s*tại)|muốn\s+chết|giết\s+(?:người|ai|tôi|em)|bạo\s*hành|xâm\s*hại|cấp\s*cứu|nguy\s+hiểm\s+(?:ngay|tức\s*thì)|suicide|self[- ]?harm|kill\s+(?:myself|someone)|rape|domestic\s+violence)/iu;
const SENSITIVE = /(?:buồn|khóc|mất\s+(?:mát|người)|qua\s+đời|(?:đau\s+(?:đớn|khổ|lòng|đầu|tim)|bị\s+đau)|bệnh|y\s*tế|bác\s*sĩ|thuốc|lo\s+quá|sợ|thất\s+vọng|bực|giận|khiếu\s*nại|lỗi|khẩn\s*cấp|\bgấp\b|pháp\s*lý|luật\s*sư|tòa\s*án|thanh\s*toán|chuyển\s*khoản|ngân\s*hàng|mật\s*khẩu|\botp\b|bị\s*hack|chiếm\s+tài\s*khoản|lừa\s*đảo|trẻ\s*(?:em|vị\s*thành\s*niên)|em\s*bé|mang\s*thai|abuse|fraud|scam)/iu;

export const ZALO_REACTION_CODES = Object.freeze({
  heart: "/-heart",
  like: "/-strong",
  haha: ":>",
  big_smile: ";-d",
  tears_of_joy: ":')",
  wow: ":o",
  cool: "x-)",
  sunglasses: "b-)",
  handclap: ":handclap",
  pray: "_()_",
  thanks: "/-thanks",
  rose: "/-rose",
  peace: "/-v",
  ok: "/-ok",
  punch: "/-punch",
  sun: "/-li",
  love: ";xx",
  confused: ";-/",
  wink: ";-)",
  beer: "/-beer",
  big_laugh: ":))",
  love_you: "/-loveu"
});

export function classifyEngagementSafety(text = "") {
  const input = String(text || "").normalize("NFKC").toLowerCase();
  if (CRITICAL.test(input)) return "critical";
  if (SENSITIVE.test(input)) return "sensitive";
  return "normal";
}

/**
 * Chọn reaction thông minh, đa dạng sắc thái và có tính bất định (lúc thả lúc không) giống người thật.
 *
 * @param {string} text Nội dung tin nhắn
 * @param {object} options
 * @param {boolean} options.deterministic Nếu true, luôn trả về reaction đại diện cố định (dùng cho test)
 * @param {number} options.probability Tỷ lệ thả reaction tự nhiên (mặc định ~68% như người thật)
 * @param {function} options.random Hàm sinh số ngẫu nhiên [0, 1)
 */
export function selectInboundReaction(text = "", { deterministic = false, probability = 0.68, random = Math.random } = {}) {
  const input = String(text || "").normalize("NFKC").toLowerCase().trim();
  if (!input || classifyEngagementSafety(input) !== "normal") return "";

  // 1. Nhóm Cảm ơn / Biết ơn / Cầu chúc / Trân trọng đối tác & khách hàng
  if (/(?:cảm\s*ơn|cam\s*on|tks|thanks|cám\s*ơn|biết\s*ơn|cảm\s*tạ|giúp\s*(?:mình|em|anh)\s*(?:với|nhé|nha\s*❤️)|được\s*rồi\s*ạ)/iu.test(input)) {
    if (deterministic) return "heart";
    // Người thật rất hay thả cảm xúc khi nhận lời cảm ơn (~85% xác suất)
    if (random() > 0.85) return "";
    const list = ["heart", "pray", "thanks", "rose", "peace"];
    return list[Math.floor(random() * list.length)];
  }

  // 2. Nhóm Vui vẻ / Hài hước / Cười đùa / Thân thiện
  if (/(?:haha|hihi|hehe|lol|kiki|keke|vui|hài|buồn\s*cười|tếu|bựa|kkk|:d|:v|:\)|=d|=\))/iu.test(input)) {
    if (deterministic) return "haha";
    if (random() > 0.80) return "";
    const list = ["haha", "tears_of_joy", "big_smile", "big_laugh", "wink"];
    return list[Math.floor(random() * list.length)];
  }

  // 3. Nhóm Khen ngợi / Đỉnh cao / Xịn xò / Chuyên nghiệp / Uy tín
  if (/(?:đỉnh|quá\s*đỉnh|xịn|pro|giỏi|tuyệt|tuyệt\s*vời|vip|hay\s*quá|chuẩn|xuất\s*sắc|uy\s*tín|bén|cháy|chất)/iu.test(input)) {
    if (deterministic) return "cool";
    if (random() > 0.80) return "";
    const list = ["cool", "handclap", "sunglasses", "like", "punch"];
    return list[Math.floor(random() * list.length)];
  }

  // 4. Nhóm Chốt deal / Đồng ý / Duyệt / Lệnh làm việc / Nhất trí
  if (/(?:ok(?:e|ay)?|nhất\s*trí|triển|làm\s*đi|lệnh|giúp\s*anh|soạn|triển\s*khai|duyệt|chốt|tiến\s*hành|đồng\s*ý|giao\s*việc)/iu.test(input)) {
    if (deterministic) return "ok";
    if (random() > 0.75) return "";
    const list = ["ok", "like", "punch", "sun"];
    return list[Math.floor(random() * list.length)];
  }

  // 5. Nhóm Yêu quý / Tình cảm / Quý mến / Dễ thương
  if (/(?:yêu|quý|thương|cute|dễ\s*thương|đáng\s*yêu|❤️|❤|♥|🥰|😍|mến)/iu.test(input)) {
    if (deterministic) return "heart";
    if (random() > 0.85) return "";
    const list = ["heart", "love", "love_you", "rose"];
    return list[Math.floor(random() * list.length)];
  }

  // 6. Nhóm Bất ngờ / Ngạc nhiên / Thú vị
  if (/(?:thật\s*(?:á|sao|hả)|ghê|uầy|oa|wow|bất\s*ngờ|ảo\s*thật|kinh\s*thật)/iu.test(input)) {
    if (deterministic) return "wow";
    if (random() > 0.75) return "";
    const list = ["wow", "cool", "sunglasses"];
    return list[Math.floor(random() * list.length)];
  }

  // 7. Nhóm Chào hỏi / Bắt đầu trò chuyện
  if (/^(?:alo|a\s*lô|hello|hi|chào|em\s*ơi|amon\s*ơi|ad\s*ơi|shop\s*ơi)(?:\s+(?:em|amon|anh|chị|shop|ad|nha|nhé|ạ))*[.!?…]*$/iu.test(input)) {
    if (deterministic) return "like";
    if (random() > 0.70) return "";
    const list = ["like", "peace", "big_smile", "sun", "wink"];
    return list[Math.floor(random() * list.length)];
  }

  // 8. Nhóm Thắc mắc / Hỏi đáp / Phân vân
  if (/(?:\?|sao\s*lại|tại\s*sao|như\s*thế\s*nào|ra\s*sao|liệu\s*có|được\s*không|đc\s*k)/iu.test(input)) {
    if (deterministic) return "";
    // Người thật khi suy nghĩ câu hỏi kỹ thuật/hỏi đáp thường ít khi thả ngay, chỉ thả nhẹ hoặc để trống
    if (random() > 0.40) return "";
    const list = ["confused", "ok", "wink"];
    return list[Math.floor(random() * list.length)];
  }

  // 9. Tin nhắn thông thường khác: Bất định (Lúc thả lúc không, ~50% để tạo độ tự nhiên)
  if (deterministic) return "";
  if (random() > (probability * 0.7)) return "";
  const casualList = ["like", "ok", "peace", "sun", "big_smile"];
  return casualList[Math.floor(random() * casualList.length)];
}

export function buildFriendRequestMessage(agentName = "Amon") {
  const safeName = String(agentName || "Amon").replace(/[\r\n]/gu, " ").trim().slice(0, 40) || "Amon";
  return `${safeName} xin phép kết bạn để hỗ trợ mình thuận tiện hơn nhé 🐾`;
}

export function firstContactReplyInstruction(agentName = "Amon") {
  const safeName = String(agentName || "Amon").replace(/[\r\n]/gu, " ").trim().slice(0, 40) || "Amon";
  return `Đây là lượt DM đầu tiên. Mở bằng một lời chào ngắn, ấm và tự nhiên của ${safeName}, rồi trả lời thẳng việc người dùng vừa hỏi. Chỉ chào một lần; không chào lại ở các lượt sau.`;
}

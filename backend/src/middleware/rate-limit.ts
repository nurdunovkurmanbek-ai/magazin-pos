import rateLimit from 'express-rate-limit';

const rateLimitMessage = {
  success: false,
  message: 'Өтө көп суроо, кийинчерээк кайра аракет кылыңыз',
};

/** Глобалдык rate limit */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage,
});

/** Auth маршруттары үчүн */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage,
});

/** Кирүү — brute-force коргоо */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Өтө көп кирүү аракети. 15 мүнөттөн кийин кайра аракет кылыңыз',
  },
});

/** Сырсөздү унутуу */
export const forgotPasswordRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Өтө көп суроо. 1 сааттан кийин кайра аракет кылыңыз',
  },
});

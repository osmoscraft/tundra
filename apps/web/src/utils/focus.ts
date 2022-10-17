import { $$ } from "./query";

export const $$focusable = $$.bind(null, `a[href], button, input, textarea, select, details,[tabindex]:not([tabindex="-1"])`);

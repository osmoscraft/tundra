const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789     "; // number of spaces controls word length

function generateString(length: number) {
  let result = " ";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

export function* generateArticle(averageLength: number, limit: number) {
  for (let i = 0; i < limit; i++) {
    const length = Math.floor(averageLength * (1 + Math.random() * 0.5));
    yield generateString(length);
  }
}

export async function* generateArticlesAsync(averageLength: number, limit: number) {
  for (let i = 0; i < limit; i++) {
    const length = Math.floor(averageLength * (1 + Math.random() * 0.5));
    yield generateString(length);
  }
}

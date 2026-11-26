import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

// Senhas NUNCA são guardadas. Guardamos um "hash": o resultado de uma conta de mão única.
// Dá pra conferir se uma senha bate com o hash, mas não dá pra voltar do hash pra senha.
//
// scrypt é um algoritmo feito pra ser LENTO e gastar memória de propósito:
// tentar milhões de senhas fica caro demais pra quem roubar o banco.
// Vem no próprio Node (node:crypto), sem biblioteca extra.

const scryptAsync = promisify(scrypt) as (
  senha: string,
  sal: Buffer,
  tamanho: number,
) => Promise<Buffer>;

const TAMANHO = 64;

/** "minhasenha" → "scrypt$<sal>$<hash>" (é isso que vai pro banco) */
export async function gerarHashDeSenha(senha: string): Promise<string> {
  // O "sal" é aleatório por usuário: duas pessoas com a mesma senha têm hashes diferentes.
  const sal = randomBytes(16);
  const hash = await scryptAsync(senha, sal, TAMANHO);
  return `scrypt$${sal.toString("base64")}$${hash.toString("base64")}`;
}

/** Confere se a senha digitada bate com o hash salvo. */
export async function conferirSenha(
  senha: string,
  hashSalvo: string,
): Promise<boolean> {
  const [algoritmo, salBase64, hashBase64] = hashSalvo.split("$");
  if (algoritmo !== "scrypt" || !salBase64 || !hashBase64) return false;

  const esperado = Buffer.from(hashBase64, "base64");
  const calculado = await scryptAsync(
    senha,
    Buffer.from(salBase64, "base64"),
    esperado.length,
  );
  // timingSafeEqual compara sempre no mesmo tempo. Uma comparação comum (===) para no
  // primeiro byte diferente, e medir esse tempo daria pistas sobre o hash.
  return (
    calculado.length === esperado.length && timingSafeEqual(calculado, esperado)
  );
}

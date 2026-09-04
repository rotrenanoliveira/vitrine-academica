/**
 * PT - Tornar algumas propriedades do tipo T opcionais
 *
 * EN - Make some properties of the type T optional
 */
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>

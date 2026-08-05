export type PolicyAcknowledgement = { adults: boolean; consensual: boolean; noDeepfake: boolean };
export function validatePolicyAcknowledgement(value: PolicyAcknowledgement) {
  if (!value.adults) throw new Error("Запрещены несовершеннолетние и персонажи неопределённого возраста");
  if (!value.consensual) throw new Error("Запрещены сексуальное насилие и контент без согласия");
  if (!value.noDeepfake) throw new Error("Запрещён несанкционированный сексуализированный дипфейк");
  return true;
}

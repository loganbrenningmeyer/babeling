import { AlignmentPayload } from "./pageTranslation"

// -------------------------
// Backend return type
// -------------------------
export type AlignResponseDTO = {
  src: AlignmentPayload["src"];
  tgt: AlignmentPayload["tgt"];
  align: AlignmentPayload["align"];
};
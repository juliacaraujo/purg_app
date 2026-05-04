// Para adicionar um novo avatar:
// 1. Coloque o arquivo em assets/avatar/
// 2. Adicione uma linha aqui com a chave = avatar_id do backend

const avatarMap: Record<number, ReturnType<typeof require>> = {
  1:  require("../../assets/avatar/alienigena_azul_avatar.png"),
  2:  require("../../assets/avatar/animal_capivara_avatar.png"),
  3:  require("../../assets/avatar/animal_galo_avatar.png"),
  4:  require("../../assets/avatar/animal_pinguin_avatar.png"),
  5:  require("../../assets/avatar/elemento_agua_fuinha_avatar.png"),
  6:  require("../../assets/avatar/elemento_ar_nuvem_avatar.png"),
  7:  require("../../assets/avatar/elemento_terra_tartaruga_avatar.png"),
  8:  require("../../assets/avatar/mitologia_fauno_avatar.png"),
  9:  require("../../assets/avatar/mitologia_fenix_avatar.png"),
  10: require("../../assets/avatar/mitologia_medusa_avatar.png"),
  11: require("../../assets/avatar/purg_avatar.png"),
  12: require("../../assets/avatar/robo_avatar.png"),
};

export default avatarMap;

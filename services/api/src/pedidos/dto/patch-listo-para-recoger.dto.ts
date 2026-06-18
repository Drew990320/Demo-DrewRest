import { IsBoolean } from 'class-validator';

export class PatchListoParaRecogerDto {
  @IsBoolean()
  listo_para_recoger!: boolean;
}

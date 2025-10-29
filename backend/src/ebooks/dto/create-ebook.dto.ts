import { IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateEbookDto {
  @IsString()
  @IsNotEmpty({ message: 'El título es obligatorio.' })
  @MaxLength(200)
  titulo: string;

  @IsOptional()
  @IsUrl({}, { message: 'La imagen debe ser una URL válida.' })
  imagen_url?: string;

  @IsOptional()
  @IsUrl({}, { message: 'El archivo debe ser una URL válida.' })
  archivo_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descripcion?: string;
}

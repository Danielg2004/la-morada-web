import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  IsNumber,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateEbookDto {
  @IsString()
  @IsNotEmpty({ message: 'El título es obligatorio.' })
  @MaxLength(200)
  titulo!: string;

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

  // NUEVO: precio (>= 0). Transform para convertir string->number si viene desde JSON/form.
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : Number(value)))
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'El precio debe ser un número.' })
  @Min(0, { message: 'El precio no puede ser negativo.' })
  price?: number;
}

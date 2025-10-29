import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class NoteDto {
  @IsString()
  @IsNotEmpty({ message: 'El título es obligatorio.' })
  @MaxLength(200)
  titulo: string;

  @IsString()
  @IsNotEmpty({ message: 'El contenido es obligatorio.' })
  @MaxLength(10000)
  contenido: string;
}

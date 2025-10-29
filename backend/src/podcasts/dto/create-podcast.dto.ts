import { IsNotEmpty, IsString, MaxLength, IsUrl } from 'class-validator';

export class CreatePodcastDto {
  @IsString()
  @IsNotEmpty({ message: 'El título es obligatorio.' })
  @MaxLength(200)
  titulo: string;

  @IsString()
  @MaxLength(1000)
  descripcion: string;

  @IsString()
  @IsNotEmpty({ message: 'El embed_url es obligatorio.' })
  @IsUrl({}, { message: 'Debes ingresar una URL válida (iframe/link de Spotify/YouTube, etc.).' })
  embed_url: string;
}

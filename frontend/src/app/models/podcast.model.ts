export interface Podcast {
  id: string;
  titulo: string;
  descripcion: string;
  embed_url: string;
  creado_por?: string;
  autor_nombre?: string;
  creado_en?: string;
  es_favorito?: boolean;
  progreso?: number; // segundos (cuando detail)
}

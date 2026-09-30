export interface GalleryItem {
  id: string
  title: string
  category?: string
  image_url: string
  order?: number
  created?: string
  updated?: string
}

export interface NeighborhoodItem {
  id: string
  name: string
  description?: string
  distance: string
  icon?: string
  image_url?: string
  order?: number
  created?: string
  updated?: string
}

export interface FloorplanItem {
  id: string
  name: string
  tagline?: string
  area: string
  suites_parking: string
  description: string
  image_url: string
  order?: number
  created?: string
  updated?: string
}

export interface InquiryInput {
  name: string
  email: string
  phone: string
  message?: string
}

export interface InquiryItem extends InquiryInput {
  id: string
  created?: string
}

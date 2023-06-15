import { UseSwipeDirection } from "@vueuse/core"

export const useImageGallery = () => {
  const nuxtApp = useNuxtApp()
  const config = useRuntimeConfig()
  const imageToDownload = ref()
  const route = useRoute()
  const router = useRouter()

  const currentIndex: ComputedRef<number> = computed(() => nuxtApp.$file.images.value!.findIndex((image: any) => image.key.split('.')[0] === route.params.slug[0]))
  const isFirstMovie: ComputedRef<boolean> = computed(() => nuxtApp.$file.images.value![0].key.split('.')[0] === route.params.slug[0])
  const isLastMovie: ComputedRef<boolean> = computed(() => nuxtApp.$file.images.value![nuxtApp.$file.images.value!.length - 1].key.split('.')[0] === route.params.slug[0])

  const initSwipe = (el: Ref<HTMLElement | null>) => {
    useSwipe(el, {
      passive: false,

      onSwipeEnd(e: TouchEvent, direction: UseSwipeDirection) {
        if (direction === 'left') {
          if (isLastMovie.value) {
            router.push('/')
          } else {
            router.push(`/detail/${nuxtApp.$file.images.value![currentIndex.value + 1].key.split('.')[0]}`)
          }
        } else {
          if (isFirstMovie.value) {
            router.push('/')
          } else {
            router.push(`/detail/${nuxtApp.$file.images.value![currentIndex.value - 1].key.split('.')[0]}`)
          }
        }
      },
    })
  }


  const applyFilters = async (imageContainer: HTMLElement | undefined, poster: CanvasImageSource | null, contrast: number, blur: number, invert: number, saturate: number, hueRotate: number, sepia: number, filter: boolean = false) => {
    const canvas: HTMLCanvasElement = document.createElement('canvas')
    const context: CanvasRenderingContext2D | null = canvas.getContext('2d')

    canvas.width = imageContainer!.getBoundingClientRect().width
      // if filter panel we must restore orignal height
    canvas.height = filter ? (imageContainer!.getBoundingClientRect().height * 100) / 80 : imageContainer!.getBoundingClientRect().height

    context!.filter = `contrast(${contrast}%) blur(${blur}px) invert(${invert}%)
      saturate(${saturate}%) hue-rotate(${hueRotate}deg) sepia(${sepia}%)`

    context!.drawImage(poster!, 0, 0, canvas.width, canvas.height)

    const modifiedImage = new Image()

    modifiedImage.src = canvas.toDataURL('image/png')
    imageToDownload.value = modifiedImage

    return imageToDownload
  }

  const downloadImage = async (filename: string, imageContainer: HTMLElement | undefined, poster: CanvasImageSource, contrast: number, blur: number, invert: number, saturate: number, hueRotate: number, sepia: number) => {

    await applyFilters(imageContainer, poster, contrast, blur, invert, saturate, hueRotate, sepia)

    await useFetch(imageToDownload.value.src, {
      baseURL: `${config.public.imageApi}/ipx/_/tmdb/`,
    }).then((response: any) => {
      const blob: any = response.data.value
      const url: string = URL.createObjectURL(blob)
      const link: HTMLAnchorElement = document.createElement('a')

      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.click()
    })
  }

  const convertBase64ToFile = async (image: any, originalImage: any, ) => {

    const url = image.value.currentSrc;

    const response = await fetch(url);
    const blob = await response.blob();
    const convertedFile = new File([blob], originalImage.value.key.split('.')[1], { type: `image/${originalImage.value.key.split('.')[1] }` });

    return convertedFile;
  }

  return {
    downloadImage,
    applyFilters,
    currentIndex,
    isFirstMovie,
    isLastMovie,
    initSwipe,
    convertBase64ToFile
  }
}

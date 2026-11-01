// note: nuqs menulis ?tab lewat history API tanpa lewat react-router, jadi dasar perubahan param lain harus URL asli, bukan state react-router yang bisa ketinggalan
export function currentSearchParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

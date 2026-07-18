# Toast: Indonesian-only, right-bottom, above bottom nav

## Problem

- Sonner `<Toaster>` at default position (bottom-center) overlaps mobile bottom tab bar (`fixed bottom-0 z-30`).
- Admin files still use hardcoded English toast strings while the rest of the app is Indonesian-only.
- No z-index control, toast hidden behind mobile nav.

## Changes

### 1. `src/components/ui/sonner.tsx`
- Force `theme="light"` (ignore system theme for toasts).
- Set `position="bottom-right"`.
- Add bottom offset (`style={{ zIndex: 100 }}` + className or inline style) so toasts clear the mobile nav bar (~56px).
- Keep existing design-token styling (bg-popover, text-popover-foreground, etc.).

### 2. Admin toast strings → Indonesian (5 files)

| File | Original | Indonesian |
|------|----------|------------|
| AdminDashboard.tsx:71 | `"Token copied to clipboard"` | `"Token disalin ke papan klip"` |
| AdminDashboard.tsx:93 | `"Core data purged."` | `"Data utama dibersihkan."` |
| AdminDashboard.tsx:95 | `"Cleanup failed."` | `"Pembersihan gagal."` |
| CurriculumTab.tsx:47 | `"Item removed from curriculum"` | `"Item dihapus dari kurikulum"` |
| CurriculumTab.tsx:49 | `"Failed to remove item"` | `"Gagal menghapus item"` |
| CurriculumTab.tsx:63 | `` `Successfully deleted ${selectedIds.length} items.` `` | `` `Berhasil menghapus ${selectedIds.length} item.` `` |
| CurriculumTab.tsx:66 | `` `Batch delete failed: ${err.message}` `` | `` `Hapus massal gagal: ${err.message}` `` |
| MasterDataTab.tsx:78 | `"Course deleted successfully."` | `"Mata kuliah berhasil dihapus."` |
| MasterDataTab.tsx:80 | `"Delete failed."` | `"Hapus gagal."` |
| MasterDataTab.tsx:93 | `"Course updated."` | `"Mata kuliah diperbarui."` |
| MasterDataTab.tsx:95 | `"Individual creation for master not implemented yet."` | `"Pembuatan individu untuk master belum tersedia."` |
| MasterDataTab.tsx:99 | `"Save failed."` | `"Simpan gagal."` |
| MasterDataTab.tsx:118 | `` `Successfully deployed ${data.length} strategy components.` `` | `` `Berhasil menyebarkan ${data.length} komponen.` `` |
| MasterDataTab.tsx:121 | `` `Deployment failed: ${err.message}` `` | `` `Penyebaran gagal: ${err.message}` `` |
| MasterDataTab.tsx:166 | `` `Successfully imported ${formattedData.length} records from CSV.` `` | `` `Berhasil mengimpor ${formattedData.length} data dari CSV.` `` |
| MasterDataTab.tsx:170 | `` `CSV Import failed: ${err.message}` `` | `` `Impor CSV gagal: ${err.message}` `` |
| MasterDataTab.tsx:176 | `"CSV Parse failed: " + err.message` | `"Parse CSV gagal: " + err.message` |
| MasterDataTab.tsx:186 | `` `Fixed ${result.fixedCount} formatting issues.` `` | `` `Memperbaiki ${result.fixedCount} masalah format.` `` |
| MasterDataTab.tsx:188 | `"Fix failed: " + err.message` | `"Perbaikan gagal: " + err.message` |
| MasterDataTab.tsx:204 | `` `Successfully deleted ${selectedIds.length} items.` `` | `` `Berhasil menghapus ${selectedIds.length} item.` `` |
| MasterDataTab.tsx:207 | `"Batch delete failed: " + err.message` | `"Hapus massal gagal: " + err.message` |
| MasterDataTab.tsx:222 | `"Purge failed."` | `"Pembersihan gagal."` |
| MasterDataTab.tsx:220 | `` `Data for ${prodiFilter} purged.` `` | `` `Data ${prodiFilter} dibersihkan.` `` |
| IntelligenceScraperDialog.tsx:189 | `` `Successfully parsed and deployed ${data.length} components.` `` | `` `Berhasil parse dan sebarkan ${data.length} komponen.` `` |
| IntelligenceScraperDialog.tsx:195 | `"Parsing failed: " + err.message` | `"Parse gagal: " + err.message` |
| IntelligenceScraperDialog.tsx:215 | `"Using cached AI result."` | `"Memakai hasil AI dari cache."` |
| IntelligenceScraperDialog.tsx:237 | `` `AI successfully cleaned and deployed ${data.length} components.` `` | `` `AI berhasil membersihkan ${data.length} komponen.` `` |
| IntelligenceScraperDialog.tsx:243 | `"Cleanup failed: " + err.message` | `"Pembersihan gagal: " + err.message` |
| IntelligenceScraperDialog.tsx:307 | `"Structure template copied to clipboard"` | `"Template struktur disalin"` |
| CurriculumImportDialog.tsx:76 | `` `Successfully added ${count} items to ${importProdi} Sem ${importSemester}` `` | `` `Berhasil menambah ${count} item ke ${importProdi} Sem ${importSemester}` `` |
| CurriculumImportDialog.tsx:82 | `"Import failed: " + err.message` | `"Impor gagal: " + err.message` |
| CurriculumImportDialog.tsx:168 | `"Curriculum template copied"` | `"Template kurikulum disalin"` |

### 3. Confirm `t()` toast keys are all Indonesian (already done)

LanguageContext already has all `toast.*` keys in Indonesian. Non-admin components already use `t()`. No change needed.

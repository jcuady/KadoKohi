/**
 * Thin API wrapper — DB-readiness layer.
 *
 * Today: each function delegates to the corresponding Zustand store.
 * Tomorrow: replace internals with fetch() calls to REST endpoints.
 *
 * Every store action is mirrored here so components can import from one
 * place. When the backend lands, only this file changes.
 */

import { useAuthStore } from '../store/authStore';
import { useBranchStore } from '../store/branchStore';
import { useMenuStore } from '../store/menuStore';
import { useOrderStore } from '../store/orderStore';
import { useEventStore } from '../store/eventStore';
import { useTableStore } from '../store/tableStore';
import { useSectionStore } from '../store/sectionStore';
import { useUserStore } from '../store/userStore';
import { useSettingsStore } from '../store/settingsStore';
import { useCartStore } from '../store/cartStore';
import { useMerchStore } from '../store/merchStore';
import { useLoyaltyStore } from '../store/loyaltyStore';
import { useBoothCatalogStore } from '../store/boothCatalogStore';
import { useBookingEstimateStore } from '../store/bookingEstimateStore';
import { useBoothBookingStore } from '../store/boothBookingStore';
import { useBoothShowcaseStore } from '../store/boothShowcaseStore';
import { useLandingContentStore } from '../store/landingContentStore';

export const api = {
  /* ───── Auth ───── */
  auth: {
    getUser: () => useAuthStore.getState().user,
    loginAs: useAuthStore.getState().loginAs,
    logout: useAuthStore.getState().logout,
    addLoyaltyStamps: useAuthStore.getState().addLoyaltyStamps,
  },

  /* ───── Branches ───── */
  branches: {
    list: () => useBranchStore.getState().branches,
    getById: (id: string) => useBranchStore.getState().getBranch(id),
    create: useBranchStore.getState().addBranch,
    update: useBranchStore.getState().updateBranch,
    remove: useBranchStore.getState().removeBranch,
  },

  /* ───── Menu ───── */
  menu: {
    categories: () => useMenuStore.getState().categories,
    products: () => useMenuStore.getState().products,
    productsByCategory: (catId: string) => useMenuStore.getState().productsByCategory(catId),
    addCategory: useMenuStore.getState().addCategory,
    updateCategory: useMenuStore.getState().updateCategory,
    removeCategory: useMenuStore.getState().removeCategory,
    reorderCategories: useMenuStore.getState().reorderCategories,
    addProduct: useMenuStore.getState().addProduct,
    updateProduct: useMenuStore.getState().updateProduct,
    removeProduct: useMenuStore.getState().removeProduct,
    reorderProductsInCategory: useMenuStore.getState().reorderProductsInCategory,
  },

  /* ───── Orders ───── */
  orders: {
    list: () => useOrderStore.getState().orders,
    create: useOrderStore.getState().createOrder,
    updateStatus: useOrderStore.getState().updateOrderStatus,
    forBranch: (branchId: string, channels?: string[]) =>
      useOrderStore.getState().ordersForBranch(branchId, channels as never),
    forBarista: (branchId: string) => useOrderStore.getState().ordersForBarista(branchId),
  },

  /* ───── Events ───── */
  events: {
    list: () => useEventStore.getState().events,
    visible: () => useEventStore.getState().visibleEvents(),
    highlight: () => useEventStore.getState().highlightEvent(),
    create: useEventStore.getState().addEvent,
    update: useEventStore.getState().updateEvent,
    remove: useEventStore.getState().removeEvent,
  },

  /* ───── Tables ───── */
  tables: {
    list: () => useTableStore.getState().tables,
    forBranch: (branchId: string) => useTableStore.getState().tablesForBranch(branchId),
    getByCode: (code: string) => useTableStore.getState().getByCode(code),
    create: useTableStore.getState().addTable,
    update: useTableStore.getState().updateTable,
    remove: useTableStore.getState().removeTable,
    toggleActive: useTableStore.getState().toggleActive,
  },

  /* ───── Custom Sections ───── */
  sections: {
    list: () => useSectionStore.getState().sections,
    visible: (page: 'home') => useSectionStore.getState().visibleSections(page),
    create: useSectionStore.getState().addSection,
    update: useSectionStore.getState().updateSection,
    remove: useSectionStore.getState().removeSection,
  },

  /* ───── Users ───── */
  users: {
    list: () => useUserStore.getState().users,
    getById: (id: string) => useUserStore.getState().getById(id),
    getByEmail: (email: string) => useUserStore.getState().users.find((u) => u.email === email),
    create: useUserStore.getState().addUser,
    update: useUserStore.getState().updateUser,
    remove: useUserStore.getState().removeUser,
  },

  /* ───── Cart (online ordering) ───── */
  cart: {
    items: () => useCartStore.getState().items,
    add: useCartStore.getState().addItem,
    remove: useCartStore.getState().removeItem,
    updateQty: useCartStore.getState().updateQty,
    clear: useCartStore.getState().clear,
  },

  /* ───── Merch ───── */
  merch: {
    categories: () => useMerchStore.getState().categories,
    products: () => useMerchStore.getState().products,
    productsByCategory: (catId: string) => useMerchStore.getState().productsByCategory(catId),
    addCategory: useMerchStore.getState().addCategory,
    updateCategory: useMerchStore.getState().updateCategory,
    removeCategory: useMerchStore.getState().removeCategory,
    addProduct: useMerchStore.getState().addProduct,
    updateProduct: useMerchStore.getState().updateProduct,
    removeProduct: useMerchStore.getState().removeProduct,
  },

  /* ───── Loyalty ───── */
  loyalty: {
    config: () => useLoyaltyStore.getState().config,
    updateConfig: useLoyaltyStore.getState().updateConfig,
    addReward: useLoyaltyStore.getState().addReward,
    updateReward: useLoyaltyStore.getState().updateReward,
    removeReward: useLoyaltyStore.getState().removeReward,
    toggleReward: useLoyaltyStore.getState().toggleReward,
  },

  /* ───── Booth Catalog ───── */
  boothCatalog: {
    packages: () => useBoothCatalogStore.getState().packages,
    addons: () => useBoothCatalogStore.getState().addons,
    visiblePackagesForBranch: (branchId: string) =>
      useBoothCatalogStore.getState().visiblePackagesForBranch(branchId),
    visibleAddonsForBranch: (branchId: string) =>
      useBoothCatalogStore.getState().visibleAddonsForBranch(branchId),
    addPackage: useBoothCatalogStore.getState().addPackage,
    updatePackage: useBoothCatalogStore.getState().updatePackage,
    removePackage: useBoothCatalogStore.getState().removePackage,
    reorderPackages: useBoothCatalogStore.getState().reorderPackages,
    addAddon: useBoothCatalogStore.getState().addAddon,
    updateAddon: useBoothCatalogStore.getState().updateAddon,
    removeAddon: useBoothCatalogStore.getState().removeAddon,
    reorderAddons: useBoothCatalogStore.getState().reorderAddons,
  },

  /* ───── Booth Showcase ───── */
  boothShowcase: {
    list: () => useBoothShowcaseStore.getState().media,
    visible: () => useBoothShowcaseStore.getState().visibleMedia(),
    add: useBoothShowcaseStore.getState().addMedia,
    update: useBoothShowcaseStore.getState().updateMedia,
    remove: useBoothShowcaseStore.getState().removeMedia,
    reorder: useBoothShowcaseStore.getState().reorderMedia,
  },

  /* ───── Booking Estimates ───── */
  bookingEstimates: {
    list: () => useBookingEstimateStore.getState().estimates,
    draft: () => useBookingEstimateStore.getState().draft,
    calculate: useBookingEstimateStore.getState().calculateEstimate,
    save: useBookingEstimateStore.getState().saveEstimate,
    remove: useBookingEstimateStore.getState().removeEstimate,
    updateStatus: useBookingEstimateStore.getState().updateEstimateStatus,
    setDraft: useBookingEstimateStore.getState().setDraft,
    clearDraft: useBookingEstimateStore.getState().clearDraft,
  },

  /* ───── Booth Bookings ───── */
  boothBookings: {
    list: () => useBoothBookingStore.getState().bookings,
    create: useBoothBookingStore.getState().createBooking,
    update: useBoothBookingStore.getState().updateBooking,
    updateStatus: useBoothBookingStore.getState().updateStatus,
    assignStaff: useBoothBookingStore.getState().assignStaff,
    forBranch: (branchId: string) => useBoothBookingStore.getState().bookingsForBranch(branchId),
    forStaff: (staffId: string, branchId?: string) =>
      useBoothBookingStore.getState().bookingsForStaff(staffId, branchId),
  },

  /* ───── Settings ───── */
  settings: {
    get: () => useSettingsStore.getState().settings,
    update: useSettingsStore.getState().updateSettings,
    toggleTheme: useSettingsStore.getState().toggleDashTheme,
  },

  /* ───── Landing Content ───── */
  landing: {
    get: () => useLandingContentStore.getState().content,
    setHeroSlides: useLandingContentStore.getState().setHeroSlides,
    reorderHomeBlocks: useLandingContentStore.getState().reorderHomeBlocks,
    toggleHomeBlock: useLandingContentStore.getState().toggleHomeBlock,
    updateFeatured: useLandingContentStore.getState().updateFeatured,
    updateEvents: useLandingContentStore.getState().updateEvents,
    updateTestimonials: useLandingContentStore.getState().updateTestimonials,
    updateSchedule: useLandingContentStore.getState().updateSchedule,
  },

  /** Resets all stores to seed data — useful for dev/testing. */
  resetAll: () => {
    useBranchStore.getState().seed();
    useMenuStore.getState().seed();
    useOrderStore.getState().seed();
    useEventStore.getState().seed();
    useTableStore.getState().seed();
    useSectionStore.getState().seed();
    useUserStore.getState().seed();
    useSettingsStore.getState().seed();
    useMerchStore.getState().seed();
    useLoyaltyStore.getState().seed();
    useBoothCatalogStore.getState().seed();
    useBoothShowcaseStore.getState().seed();
    useBookingEstimateStore.getState().seed();
    useBoothBookingStore.getState().seed();
    useLandingContentStore.getState().seed();
    useCartStore.getState().clear();
    useAuthStore.getState().logout();
  },
} as const;

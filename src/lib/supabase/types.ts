export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      kk_profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: string;
          branch_id: string | null;
          loyalty_stamps: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role: string;
          branch_id?: string | null;
          loyalty_stamps?: number;
        };
        Update: Partial<Database['public']['Tables']['kk_profiles']['Insert']>;
      };
      kk_branches: {
        Row: {
          id: string;
          slug: string;
          name: string;
          address: string;
          city: string;
          status: string;
          hours: Json;
          hero_image: string | null;
          lat: number | null;
          lng: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          slug: string;
          name: string;
          address: string;
          city: string;
          status: string;
          hours?: Json;
          hero_image?: string | null;
          lat?: number | null;
          lng?: number | null;
        };
        Update: Partial<Database['public']['Tables']['kk_branches']['Insert']>;
      };
      kk_menu_categories: {
        Row: {
          id: string;
          branch_id: string | null;
          name: string;
          sort_order: number;
          visible: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          branch_id?: string | null;
          name: string;
          sort_order?: number;
          visible?: boolean;
        };
        Update: Partial<Database['public']['Tables']['kk_menu_categories']['Insert']>;
      };
      kk_products: {
        Row: {
          id: string;
          category_id: string;
          branch_id: string | null;
          name: string;
          description: string | null;
          base_price: number;
          image: string | null;
          temperature: string;
          sizes: Json;
          milks: Json;
          tags: Json;
          custom_fields: Json;
          visible: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          category_id: string;
          branch_id?: string | null;
          name: string;
          description?: string | null;
          base_price: number;
          image?: string | null;
          temperature: string;
          sizes?: Json;
          milks?: Json;
          tags?: Json;
          custom_fields?: Json;
          visible?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database['public']['Tables']['kk_products']['Insert']>;
      };
      kk_merch_categories: {
        Row: {
          id: string;
          name: string;
          sort_order: number;
          visible: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          sort_order?: number;
          visible?: boolean;
        };
        Update: Partial<Database['public']['Tables']['kk_merch_categories']['Insert']>;
      };
      kk_merch_products: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          description: string | null;
          base_price: number;
          image: string | null;
          variants: Json;
          tags: Json;
          visible: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          category_id: string;
          name: string;
          description?: string | null;
          base_price: number;
          image?: string | null;
          variants?: Json;
          tags?: Json;
          visible?: boolean;
          sort_order?: number;
        };
        Update: Partial<Database['public']['Tables']['kk_merch_products']['Insert']>;
      };
      kk_tables: {
        Row: {
          id: string;
          branch_id: string;
          code: string;
          label: string;
          qr_payload: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          branch_id: string;
          code: string;
          label: string;
          qr_payload: string;
          active?: boolean;
        };
        Update: Partial<Database['public']['Tables']['kk_tables']['Insert']>;
      };
      kk_orders: {
        Row: {
          id: string;
          short_code: string;
          channel: string;
          branch_id: string;
          table_id: string | null;
          customer_id: string | null;
          guest_name: string | null;
          staff_id: string | null;
          payment_method: string | null;
          payment_proof_image: string | null;
          payment_proof_uploaded_at: string | null;
          payment_status: string;
          status: string;
          subtotal: number;
          modifiers_total: number;
          tax: number;
          total: number;
          loyalty_stamps_awarded: number | null;
          loyalty_voucher_id: string | null;
          loyalty_voucher_code: string | null;
          loyalty_discount_total: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          short_code: string;
          channel: string;
          branch_id: string;
          table_id?: string | null;
          customer_id?: string | null;
          guest_name?: string | null;
          staff_id?: string | null;
          payment_method?: string | null;
          payment_proof_image?: string | null;
          payment_proof_uploaded_at?: string | null;
          payment_status: string;
          status: string;
          subtotal: number;
          modifiers_total: number;
          tax: number;
          total: number;
          loyalty_stamps_awarded?: number | null;
          loyalty_voucher_id?: string | null;
          loyalty_voucher_code?: string | null;
          loyalty_discount_total?: number | null;
        };
        Update: Partial<Database['public']['Tables']['kk_orders']['Insert']>;
      };
      kk_order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name_snapshot: string;
          item_type: string | null;
          size_id: string | null;
          size_label_snapshot: string | null;
          milk_id: string | null;
          milk_label_snapshot: string | null;
          temperature: string | null;
          merch_variants: Json;
          notes: string | null;
          unit_price: number;
          qty: number;
          line_total: number;
          created_at: string;
        };
        Insert: {
          id: string;
          order_id: string;
          product_id?: string | null;
          product_name_snapshot: string;
          item_type?: string | null;
          size_id?: string | null;
          size_label_snapshot?: string | null;
          milk_id?: string | null;
          milk_label_snapshot?: string | null;
          temperature?: string | null;
          merch_variants?: Json;
          notes?: string | null;
          unit_price: number;
          qty: number;
          line_total: number;
        };
        Update: Partial<Database['public']['Tables']['kk_order_items']['Insert']>;
      };
      kk_app_settings: {
        Row: {
          id: boolean;
          tax_rate: number;
          gcash_qr_image: string | null;
          order_hours: Json;
          landing_content: Json | null;
          booth_content: Json | null;
          matcha_content: Json | null;
          careers_content: Json | null;
          booth_catalog: Json | null;
          pastries_content: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: boolean;
          tax_rate?: number;
          gcash_qr_image?: string | null;
          order_hours?: Json;
          landing_content?: Json | null;
          booth_content?: Json | null;
          matcha_content?: Json | null;
          careers_content?: Json | null;
          booth_catalog?: Json | null;
          pastries_content?: Json | null;
        };
        Update: Partial<Database['public']['Tables']['kk_app_settings']['Insert']>;
      };
    };
  };
}

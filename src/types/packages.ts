export interface ServicePackage {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  price: number;
  active: boolean;
  validity_days: number | null;
  created_at: string;
  updated_at: string;
}

export interface ServicePackageItem {
  id: string;
  package_id: string;
  service_id: string;
  tenant_id: string;
  credits_quantity: number;
  created_at: string;
}

export interface ServicePackageItemWithService extends ServicePackageItem {
  service_name?: string;
}

export interface ClientPackagePurchase {
  id: string;
  tenant_id: string;
  client_id: string;
  package_id: string;
  status: 'pending_activation' | 'active' | 'expired' | 'cancelled' | 'finished';
  purchase_date: string;
  activated_at: string | null;
  activated_by: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  package_name?: string;
  client_name?: string;
}

export interface ClientPackageCredit {
  id: string;
  purchase_id: string;
  service_id: string;
  tenant_id: string;
  credits_total: number;
  credits_used: number;
  credits_remaining: number;
  created_at: string;
  updated_at: string;
  // Joined
  service_name?: string;
}

export interface PackageCreditMovement {
  id: string;
  credit_id: string;
  purchase_id: string;
  tenant_id: string;
  movement_type: 'activation' | 'booking_use' | 'refund' | 'manual_adjustment';
  quantity: number;
  booking_id: string | null;
  performed_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface PackageFormData {
  name: string;
  description: string;
  price: number;
  active: boolean;
  validity_days: number | null;
  items: { service_id: string; credits_quantity: number }[];
}

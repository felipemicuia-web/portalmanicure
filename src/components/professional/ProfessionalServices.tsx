import { Clock, DollarSign } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  image_url: string | null;
}

interface ProfessionalServicesProps {
  services: Service[];
}

export function ProfessionalServices({ services }: ProfessionalServicesProps) {
  if (services.length === 0) {
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  return (
    <div className="glass-panel p-4 sm:p-6">
      <h3 className="font-semibold text-base sm:text-lg mb-4">
        Serviços ({services.length})
      </h3>
      
      <div className="space-y-3">
        {services.map((service) => (
          <div
            key={service.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50"
          >
            {/* Service Image */}
            {service.image_url && (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden shrink-0">
                <img
                  src={service.image_url}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm sm:text-base">{service.name}</h4>
              
              {service.description && (
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-0.5">
                  {service.description}
                </p>
              )}

              <div className="flex items-center gap-3 mt-2 text-xs sm:text-sm">
                <span className="flex items-center gap-1 text-primary font-semibold">
                  <DollarSign className="w-3.5 h-3.5" />
                  {formatPrice(service.price)}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {service.duration_minutes} min
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

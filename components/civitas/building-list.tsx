
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Hammer, ArrowUpCircle, Loader2 } from "lucide-react";
import type { CityBuilding } from "@/lib/types/database";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface BuildingListProps {
    cityId: string;
    buildings: CityBuilding[];
}

export function BuildingList({ cityId, buildings }: BuildingListProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Hammer className="w-5 h-5" />
                    Buildings
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {buildings.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No buildings found.</p>
                    )}
                    {buildings.map((building) => (
                        <BuildingItem key={building.id} cityId={cityId} building={building} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function BuildingItem({ cityId, building }: { cityId: string; building: CityBuilding }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            // Assuming API key is handled by middleware via cookies or transparently.
            // If we need to pass a specific header here in client code, we might fail unless logged in.
            // We'll rely on global fetch wrapper or standard fetch.
            // But waits, the API requires "Authorization: Bearer <API_KEY>".
            // Our client-side code normally doesn't have the API key in plain text.
            // Usually Next.js apps use Cookies/Session. 
            // The API I wrote checks `request.headers.get('authorization')`.
            // If the app uses `next-auth` or specific auth pattern, we need to align.
            // For V1 MVP, simple fetch usually sends cookies.
            // I'll try standard fetch. If it fails, we know authentication is the gap.

            const res = await fetch(`/api/cities/${cityId}/buildings/${building.building_type}/upgrade`, {
                method: 'POST',
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Upgrade failed');
            }

            toast.success(`Started upgrade for ${building.building_type}`);
            router.refresh();

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const isUpgrading = building.upgrading;
    // Calculate progress if needed, but for now just badge.

    const cost = (building as any).next_level_cost;
    const time = (building as any).base_upgrade_time_hours;

    return (
        <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
                <div className="flex items-center gap-2">
                    <span className="font-semibold">{building.building_type}</span>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Lvl {building.level}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                    {isUpgrading ? (
                        <span className="text-amber-500 animate-pulse">Upgrading...</span>
                    ) : (
                        <span>
                            Next: {cost ? `${cost.materials}M ${cost.energy}E` : ''} • {time ? `${time}h` : ''}
                        </span>
                    )}
                </div>
            </div>

            <Button
                size="sm"
                variant="outline"
                disabled={isUpgrading || loading}
                onClick={handleUpgrade}
                title={cost ? `Cost: ${cost.materials} Materials, ${cost.energy} Energy. Time: ${time} Hours` : ''}
            >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpCircle className="w-4 h-4 mr-1" />}
                Upgrade
            </Button>
        </div>
    );
}

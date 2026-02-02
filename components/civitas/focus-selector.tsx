
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface FocusSelectorProps {
    cityId: string;
    currentFocus: string;
    lastSetAt: string | null;
}

const FOCUS_OPTIONS = [
    { value: "INFRASTRUCTURE", label: "Infrastructure (+Materials)" },
    { value: "EDUCATION", label: "Education (+Knowledge)" },
    { value: "CULTURE", label: "Culture (+Influence)" },
    { value: "DEFENSE", label: "Defense (+Energy/Mat)" },
];

export function FocusSelector({ cityId, currentFocus, lastSetAt }: FocusSelectorProps) {
    const [focus, setFocus] = useState(currentFocus);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSave = async () => {
        if (focus === currentFocus) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/cities/${cityId}/focus`, {
                method: 'POST',
                body: JSON.stringify({ focus }),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to set focus');

            toast.success("Development Focus updated!");
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Development Focus
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2">
                    <Select value={focus} onValueChange={setFocus} disabled={loading}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Focus" />
                        </SelectTrigger>
                        <SelectContent>
                            {FOCUS_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button onClick={handleSave} disabled={loading || focus === currentFocus}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Set
                    </Button>
                </div>
                {lastSetAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                        Last changed: {new Date(lastSetAt).toLocaleString()}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

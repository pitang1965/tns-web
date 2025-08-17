'use client';

import { useState } from 'react';
import { Path, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ClientItineraryInput } from '@/data/schemas/itinerarySchema';

type AddressFieldsProps = {
  basePath: string;
};

export function AddressFields({ basePath }: AddressFieldsProps) {
  const { register } = useFormContext<ClientItineraryInput>();
  const [isAddressOpen, setIsAddressOpen] = useState(false);

  return (
    <div className="space-y-2">
      <Label>住所</Label>
      <Collapsible open={isAddressOpen} onOpenChange={setIsAddressOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
          >
            {isAddressOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            <span>
              {isAddressOpen ? '入力フォームを非表示' : '入力フォームを表示'}
            </span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid grid-cols-2 gap-2">
            <Input
              {...register(
                `${basePath}.place.address.postalCode` as Path<ClientItineraryInput>
              )}
              placeholder="郵便番号"
            />
            <Input
              {...register(
                `${basePath}.place.address.prefecture` as Path<ClientItineraryInput>
              )}
              placeholder="都道府県"
            />
            <Input
              {...register(
                `${basePath}.place.address.city` as Path<ClientItineraryInput>
              )}
              placeholder="市区町村"
            />
            <Input
              {...register(
                `${basePath}.place.address.town` as Path<ClientItineraryInput>
              )}
              placeholder="町名"
            />
            <Input
              {...register(
                `${basePath}.place.address.block` as Path<ClientItineraryInput>
              )}
              placeholder="番地"
            />
            <Input
              {...register(
                `${basePath}.place.address.building` as Path<ClientItineraryInput>
              )}
              placeholder="建物名"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
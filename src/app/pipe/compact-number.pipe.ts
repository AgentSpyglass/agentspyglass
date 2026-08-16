import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'compactNumber',
    standalone: true,
})
export class CompactNumberPipe implements PipeTransform {
    transform(value?: number | null): string {
        if (value == null || value === 0) {
            return '0';
        }

        return new Intl.NumberFormat('en-US', {
            notation: 'compact',
            compactDisplay: 'short',
            maximumFractionDigits: 1,
        }).format(value);
    }
}
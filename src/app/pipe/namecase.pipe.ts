import { Pipe, PipeTransform } from "@angular/core";

@Pipe({ name: "nameCase" })
export class NameCasePipe implements PipeTransform {
    transform(value: string | null | undefined): string {
        if (!value) return "";

        return value
            .split(/([ \-'])/)
            .map(part => {
                if (part === "" || /^[ \-']$/.test(part)) return part;
                return part.charAt(0).toUpperCase() + part.slice(1);
            })
            .join("");
    }
}
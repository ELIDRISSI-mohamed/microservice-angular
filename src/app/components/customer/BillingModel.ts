export class BillingModel {
    public amount?: number;
    public name?: string;

    constructor(amount?:number, name?:string){
        this.amount = amount
        this.name = name
    }
}
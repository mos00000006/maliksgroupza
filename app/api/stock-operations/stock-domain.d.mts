export const STOCK_KINDS: readonly string[];
export const STOCK_DUTIES: readonly string[];
export const STOCK_MANAGERS: readonly string[];
export function isFullAccess(member: {role:string,access_scope:string}|null|undefined): boolean;
export function isStockManager(member: {role:string,access_scope:string}|null|undefined, duty:string):boolean;
export function canCreate(kind:string,duty:string,manager:boolean):boolean;
export function canTransition(status:string,action:string,kind:string,creator:string,actor:string,reviewer:string):boolean;
export function validateStockLines(lines:unknown,kind:string): Array<{catalogue_product_id:number,document_quantity:number,expected_quantity:number,rejected_quantity:number,reason:string}>;

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { KeycloakSecurityService } from 'src/app/services/keycloak-security.service';
import { ProductsService } from 'src/app/services/products.service';
import { ProductModel } from '../products/ProductModel';
import { BillingModel } from './BillingModel';
import { CustomerService } from 'src/app/services/customer.service';
import { ProductQteModel } from '../products/ProductQteModel';

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})
export class CustomerComponent implements OnInit {
  billing=new BillingModel()
  listProducs: any = [];
  hideFormOk:Boolean = true
  formMessage = ""
  hideFormError:Boolean = true
  product: any
  qteDemande:any=0
  prixTotal:any=0
  allPrix:any=[]
  newProducts:any=[]
  listProductsSelect : any = [];

  constructor( private router: Router, private ngxService: NgxUiLoaderService, private customerService: CustomerService, public kcService : KeycloakSecurityService, private productsService: ProductsService) { }

  ngOnInit(): void {
    this.product = new ProductModel()
    if(this.kcService.kc.authenticated){
      if(!this.isCustomerManager())  this.router.navigate(['/error'])
     
      this.productsService.getProducts()
        .subscribe(async res=>{
          this.listProducs = res;
        },err =>{
          console.log(err);
        })
    } else{
      this.router.navigate(['/']);    
    }
  }
  event(event : any){
    this.prixTotal  = this.qteDemande*this.product.prix
    // this.billing.amount=this.prixTotal
    // this.billing.nom=this.kcService.kc.tokenParsed.preferred_username
  } 
  addToStock(){
    this.hideFormError = true
    if(!this.product.libele || !this.qteDemande){
      this.hideFormError = false;
      this.formMessage = "Erreur remplissez tout les champs"
      return ;
    } else if(this.qteDemande>this.product.qte || this.qteDemande==0){
      this.hideFormError = false;
      this.formMessage = "V??tifier la quantit??"
      return
    }
    this.ngxService.start()
    this.product.prixTotal = this.prixTotal
    this.product.qteDemande = this.qteDemande
    this.listProductsSelect.push(this.product)
    console.log(this.listProductsSelect)
    this.product = new ProductModel()
    this.prixTotal=0
    this.qteDemande=0
    this.ngxService.stop()
  }
  onCancel(){
  }
  onDeleteItem(index : any){
    if (index !== -1) {
      this.listProductsSelect.splice(index, 1);
    }
  }
  onSendCommande  = async () => {
    this.ngxService.start()
    console.log(this.listProductsSelect)
    localStorage.setItem('productsSelected', JSON.stringify(this.listProductsSelect));
    let ammount = 0
    for(let i=0;i<this.listProductsSelect.length;i++){
      ammount += this.listProductsSelect[i].prix*this.listProductsSelect[i].qteDemande
      this.newProducts.push(new ProductQteModel(this.listProductsSelect[i].id, this.listProductsSelect[i].qteDemande))
    }
    this.billing.amount=ammount
    this.billing.name=this.kcService.kc.tokenParsed.preferred_username
    for(let i=0;i<this.newProducts.length;i++){
      await this.productsService.updateProductQte(this.newProducts[i]).subscribe(async (res:any)=>{
        console.log(res)
      });
    }
    console.log(this.billing)
    this.customerService.saveInoice(this.billing)
      .subscribe(res=>{
        console.log(res)
      }, err=> console.log(err))
    this.listProductsSelect = []
    this.ngxService.stop()
    this.router.navigate(['/facture']);   
  }
  isCustomerManager(){
    return this.kcService.kc.hasRealmRole('ROLE_CUSTOMER_MANAGER')
  }

}

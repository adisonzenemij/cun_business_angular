import { Component } from '@angular/core';
import { EntityCrud } from '../../../shared/working/entity-crud/entity-crud';
import { ENTITY_CONFIGS } from '../entity-configs';

@Component({
  imports: [EntityCrud],
  selector: 'app-md-d02ee146',
  styleUrl: './md-d02ee146.css',
  templateUrl: './md-d02ee146.html',
})
export class MdD02ee146 { readonly config = ENTITY_CONFIGS['d02ee146']; }

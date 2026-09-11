import { Component } from '@angular/core';
import { EntityCrud } from '../../../shared/working/entity-crud/entity-crud';
import { ENTITY_CONFIGS } from '../entity-configs';

@Component({
  imports: [EntityCrud],
  selector: 'app-md-b602ef28',
  styleUrl: './md-b602ef28.css',
  templateUrl: './md-b602ef28.html',
})
export class MdB602ef28 { readonly config = ENTITY_CONFIGS['b602ef28']; }

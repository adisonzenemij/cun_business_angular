import { Component } from '@angular/core';
import { EntityCrud } from '../../../shared/working/entity-crud/entity-crud';
import { ENTITY_CONFIGS } from '../entity-configs';

@Component({
  imports: [EntityCrud],
  selector: 'app-md-b52d40d1',
  styleUrl: './md-b52d40d1.css',
  templateUrl: './md-b52d40d1.html',
})
export class MdB52d40d1 { readonly config = ENTITY_CONFIGS['b52d40d1']; }

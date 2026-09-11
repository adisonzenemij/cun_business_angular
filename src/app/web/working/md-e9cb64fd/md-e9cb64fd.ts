import { Component } from '@angular/core';
import { EntityCrud } from '../../../shared/working/entity-crud/entity-crud';
import { ENTITY_CONFIGS } from '../entity-configs';

@Component({
  imports: [EntityCrud],
  selector: 'app-md-e9cb64fd',
  styleUrl: './md-e9cb64fd.css',
  templateUrl: './md-e9cb64fd.html',
})
export class MdE9cb64fd { readonly config = ENTITY_CONFIGS['e9cb64fd']; }

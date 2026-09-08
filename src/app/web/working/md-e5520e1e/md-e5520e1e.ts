import { Component } from '@angular/core';
import { EntityCrud } from '../../../shared/working/entity-crud/entity-crud';
import { ENTITY_CONFIGS } from '../entity-configs';

@Component({
  imports: [EntityCrud],
  selector: 'app-md-e5520e1e',
  styleUrl: './md-e5520e1e.css',
  templateUrl: './md-e5520e1e.html',
})
export class MdE5520e1e { readonly config = ENTITY_CONFIGS['e5520e1e']; }

import { Component } from '@angular/core';
import { EntityCrud } from '../../../shared/working/entity-crud/entity-crud';
import { ENTITY_CONFIGS } from '../entity-configs';

@Component({
  imports: [EntityCrud],
  selector: 'app-md-d5fb87de',
  styleUrl: './md-d5fb87de.css',
  templateUrl: './md-d5fb87de.html',
})
export class MdD5fb87de {
  readonly config = ENTITY_CONFIGS['d5fb87de'];
}

import { Component } from '@angular/core';
import { EntityCrud } from '../../../shared/working/entity-crud/entity-crud';
import { ENTITY_CONFIGS } from '../entity-configs';

@Component({
  imports: [EntityCrud],
  selector: 'app-md-d35a393b',
  styleUrl: './md-d35a393b.css',
  templateUrl: './md-d35a393b.html',
})
export class MdD35a393b {
  readonly config = ENTITY_CONFIGS['d35a393b'];
}

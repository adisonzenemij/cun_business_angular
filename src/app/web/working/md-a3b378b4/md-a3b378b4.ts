import { Component } from '@angular/core';
import { EntityCrud } from '../../../shared/working/entity-crud/entity-crud';
import { ENTITY_CONFIGS } from '../entity-configs';

@Component({
  imports: [EntityCrud],
  selector: 'app-md-a3b378b4',
  styleUrl: './md-a3b378b4.css',
  templateUrl: './md-a3b378b4.html',
})
export class MdA3b378b4 {
  readonly config = ENTITY_CONFIGS['a3b378b4'];
}

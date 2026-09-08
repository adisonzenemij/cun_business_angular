import { Component } from '@angular/core';
import { EntityCrud } from '../../../shared/working/entity-crud/entity-crud';
import { ENTITY_CONFIGS } from '../entity-configs';

@Component({
  imports: [EntityCrud],
  selector: 'app-md-a1cc27fb',
  styleUrl: './md-a1cc27fb.css',
  templateUrl: './md-a1cc27fb.html',
})
export class MdA1cc27fb {
  readonly config = ENTITY_CONFIGS['a1cc27fb'];
}

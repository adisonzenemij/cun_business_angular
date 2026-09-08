import { Component } from '@angular/core';
import { EntityCrud } from '../../../shared/working/entity-crud/entity-crud';
import { ENTITY_CONFIGS } from '../entity-configs';

@Component({
  imports: [EntityCrud],
  selector: 'app-md-8ebaa791',
  styleUrl: './md-8ebaa791.css',
  templateUrl: './md-8ebaa791.html',
})
export class Md8ebaa791 {
  readonly config = ENTITY_CONFIGS['8ebaa791'];
}

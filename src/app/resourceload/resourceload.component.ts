import { Component, OnInit } from '@angular/core';
import { ResourceloadService } from '../service/resourceload.service';
import { ApiService } from '../service/api.service';
import { inlineService } from '../service/inline.service';
import { AllocationService } from '../service/allocation.service';

@Component({
  selector: 'app-resourceload',
  templateUrl: './resourceload.component.html',
  styleUrls: ['./resourceload.component.scss']
})
export class ResourceloadComponent implements OnInit {
  newRow: any = this.getEmptyRow();
  savedRows: any[] = [];
  showEntryRow = false;
  RfpNum: number;
  uniquePhases: string[] = [];
  skillOptions: string[] = [];
  phaseSkillsets: { [key: string]: string[] } = {};
  sequenceNumbers: number[] = [];
  componentsForSequence: string[] = [];
  loading = true;

  constructor(
    private resourceloadService: ResourceloadService,
    private apiService: ApiService,
    private inlineService: inlineService,
    private allocationService: AllocationService
  ) {}

  ngOnInit(): void {
    this.RfpNum = this.apiService.getRfp();
    this.fetchSkillsAndPhases();
    this.fetchSequenceNumbers();
    this.loadSavedRows();
  }

  fetchSkillsAndPhases() {
    this.allocationService.fetchSkillsAndPhases(this.RfpNum).subscribe((data: any[]) => {
      this.phaseSkillsets = data.reduce((acc: { [key: string]: string[] }, item: any) => {
        const phase = item.phases || 'Unknown Phase';
        if (!acc[phase]) {
          acc[phase] = [];
        }
        const skillsArray = item.skills.split(',').map((skill: string) => skill.trim());
        acc[phase].push(...skillsArray);
        return acc;
      }, {});

      this.uniquePhases = Object.keys(this.phaseSkillsets);
    });
  }

  fetchSequenceNumbers() {
    this.inlineService.fetchCombine(this.RfpNum).subscribe((response: any[]) => {
      this.sequenceNumbers = [...new Set(response.map(item => parseInt(item.estimation_sequence.S)))];
    });
  }

  loadSavedRows() {
    this.loading = true;
    console.log('Starting to load saved rows...');
    
    this.resourceloadService.getResourceLoadData(this.RfpNum).subscribe(
      (data: any[]) => {
        console.log('Data fetched from backend:', data); // Log the raw data received
  
        this.loading = false;
        this.savedRows = data.map(item => {
          const mappedItem = {
            deliveryLocation: item.deliveryLocation?.S || '',
            level: item.level?.N || 0,
            sequenceNumber: item.sequenceNumber?.N || null,
            component: item.component?.S || '',
            phase: item.phase?.S || '',
            skills: item.skills?.S || '',
            total: item.total?.N || 0,
            m1: item.m1?.N || 0,
            m2: item.m2?.N || 0,
            m3: item.m3?.N || 0,
            m4: item.m4?.N || 0,
            m5: item.m5?.N || 0,
            m6: item.m6?.N || 0,
            m7: item.m7?.N || 0,
            m8: item.m8?.N || 0,
            m9: item.m9?.N || 0,
            m10: item.m10?.N || 0,
            m11: item.m11?.N || 0,
            m12: item.m12?.N || 0,
            id: item.id?.S || this.generateTempId(),
            editing: false
          };
          console.log('Mapped item:', mappedItem); // Log each mapped item
          return mappedItem;
        });
  
        console.log('Final savedRows:', this.savedRows); // Log the final savedRows array
      },
      error => {
        this.loading = false;
        console.error('Error fetching saved rows:', error); // Log any error encountered
      }
    );
  }
  
  

  onSequenceChange(selectedSequence: number) {
    this.inlineService.fetchCombine(this.RfpNum).subscribe((response: any[]) => {
      this.componentsForSequence = response
        .filter(item => parseInt(item.estimation_sequence.S) === selectedSequence)
        .map(item => item.component.S);

      this.newRow.component = '';
    });
  }

  getEmptyRow() {
    return {
      deliveryLocation: '',
      level: 0,
      sequenceNumber: null as number | null,
      component: '',
      phase: '',
      skills: '' as string,
      total: 0,
      m1: 0,
      m2: 0,
      m3: 0,
      m4: 0,
      m5: 0,
      m6: 0,
      m7: 0,
      m8: 0,
      m9: 0,
      m10: 0,
      m11: 0,
      m12: 0
    };
  }

  onPhaseChange(selectedPhase: string) {
    this.skillOptions = this.phaseSkillsets[selectedPhase] || [];
    this.newRow.skills = '';
  }

  addRow() {
    this.showEntryRow = true;
    this.newRow = this.getEmptyRow(); // Ensure newRow is reset
  }

  saveRow() {
    if (this.newRow.sequenceNumber && this.newRow.component) {
      const dataToSave = {
        RfpNum: this.RfpNum,
        listdata: [this.newRow]
      };
      this.resourceloadService.addResourceLoadData(dataToSave).subscribe(
        response => {
          console.log('Save Response:', response); // Debugging log
          // Assuming the response contains the saved row, including its ID
          // Use unshift to add the new row at the beginning of savedRows
          this.savedRows.unshift({ ...this.newRow, editing: false, id: response.id || this.generateTempId() });
          this.newRow = this.getEmptyRow(); // Reset the newRow object
          this.showEntryRow = false;
        },
        error => {
          console.error('Error saving row:', error);
        }
      );
    } else {
      console.error('Sequence Number and Component must be selected');
    }
  }
  

  // Temporary ID generator in case the backend doesn't return an ID
  generateTempId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  cancelEntry() {
    this.newRow = this.getEmptyRow();
    this.showEntryRow = false;
  }

  editRow(row: any) {
    row.editing = true;
    row.original = { ...row };
    this.skillOptions = this.phaseSkillsets[row.phase] || [];
    this.onSequenceChange(row.sequenceNumber);
  }

  saveEditedRow(row: any) {
    if (row.sequenceNumber && row.component) {
      this.resourceloadService.addResourceLoadData({ RfpNum: this.RfpNum, listdata: [row] }).subscribe(
        response => {
          console.log('Edit Save Response:', response); // Debugging log
          row.editing = false;
          delete row.original;
        },
        error => {
          console.error('Error saving edited row:', error);
        }
      );
    } else {
      console.error('Sequence Number and Component must be selected');
    }
  }

  cancelEdit(row: any) {
    Object.assign(row, row.original);
    row.editing = false;
    delete row.original;
  }

  removeSavedRow(row: any) {
    this.resourceloadService.deleteResourceLoadData(row.id, this.RfpNum).subscribe(
      response => {
        this.savedRows = this.savedRows.filter(r => r !== row);
      },
      error => {
        console.error('Error deleting row:', error);
      }
    );
  }

  updateTotal(row: any) {
    row.total = Math.round(
      row.m1 + row.m2 + row.m3 + row.m4 + row.m5 + row.m6 + row.m7 + row.m8 + row.m9 + row.m10 + row.m11 + row.m12
    );
  }

  splitTotal(row: any) {
    const hoursPerPersonPerDay = 8;
    const workingDaysPerMonth = 20; // Assuming a person works 20 days in a month
    const months = 12;
    
    // Calculate the total hours based on resources
    const totalHours = row.total * hoursPerPersonPerDay * workingDaysPerMonth;
    
    const monthKeys = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10', 'm11', 'm12'];
    
    // Clear any previous values in the monthly resource fields
    monthKeys.forEach(month => row[month] = 0);
  
    if (totalHours <= 0) {
      return;
    }
  
    // Calculate the total number of resources required per month
    const resourcesPerMonth = Math.floor(totalHours / (months * hoursPerPersonPerDay * workingDaysPerMonth));
    const extraResources = totalHours % (months * hoursPerPersonPerDay * workingDaysPerMonth);
  
    // Distribute resources across months
    monthKeys.forEach(month => row[month] = resourcesPerMonth);
  
    // Distribute the extra resources across the first few months
    for (let i = 0; i < extraResources; i++) {
      row[monthKeys[i]] += 1;
    }
  
    console.log("Updated row with split resources:", row); // For debugging
  }
  
  
}
﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AspNetSample.Core;
using AutoMapper;
using MedprAbstractions;
using MedprCore;
using MedprCore.Abstractions;
using MedprCore.DTO;
using MedprDB;
using MedprDB.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace MedprBusiness.ServiceImplementations;

public class DrugService : IDrugService
{
    private readonly IMapper _mapper;
    private readonly IUnitOfWork _unitOfWork;

    public DrugService(IMapper mapper, IUnitOfWork unitOfWork)
    {
        _mapper = mapper;
        _unitOfWork = unitOfWork;
    }

    public async Task<DrugDTO> GetDrugsByIdAsync(Guid id)
    {
        var entity = await _unitOfWork.Drugs.GetByIdAsync(id);
        var dto = _mapper.Map<DrugDTO>(entity);

        return dto;
    }

    public Task<List<DrugDTO>> GetDrugsByPageNumberAndPageSizeAsync(int pageNumber, int pageSize)
    {
        var list = _unitOfWork.Drugs
            .Get()
            .Skip(pageSize * pageNumber)
            .Take(pageSize)
            .OrderBy(drug => drug.Name)
            .Select(drug => _mapper.Map<DrugDTO>(drug))
            .ToListAsync();
        return list;
    }

    public async Task<int> CreateDrugAsync(DrugDTO dto)
    {
        var entity = _mapper.Map<Drug>(dto);

        if (entity != null)
        {
            await _unitOfWork.Drugs.AddAsync(entity);
            return await _unitOfWork.Commit();
        }
        else
        {
            throw new ArgumentException(nameof(dto));
        }
    }

    public async Task<int> PatchDrugAsync(Guid id, List<PatchModel> patchList)
    {
        await _unitOfWork.Drugs.PatchAsync(id, patchList);
        return await _unitOfWork.Commit();
    }

    public async Task<int> DeleteDrugAsync(DrugDTO dto)
    {
        var entity = _mapper.Map<Drug>(dto);

        if (entity != null)
        {
            _unitOfWork.Drugs.Remove(entity);
            return await _unitOfWork.Commit();
        }
        else
        {
            throw new ArgumentException(nameof(dto));
        }
    }
}